import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MindcoreService {
  constructor(private dataSource: DataSource) {}

  async getAggregationData() {
    // 1. Total Signals Collected
    const totalSignalsRes = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM assessment_attempts`
    );
    const totalSignalsCollected = parseInt(totalSignalsRes[0].count, 10);

    // 2. Group aggregation — group by group_id only to avoid duplicates.
    //    Also merge same-name groups by using DISTINCT ON name ordering by sample_volume desc.
    const groupQuery = `
      WITH base AS (
        SELECT 
          g.id as group_id,
          g.name as group_name,
          BOOL_OR(r.school_level IS NOT NULL) as has_school_level,
          BOOL_OR(r.corporate_account_id IS NOT NULL) as is_corporate,
          COUNT(DISTINCT r.id) as sample_volume,
          MODE() WITHIN GROUP (ORDER BY pt.code) as top_profile_code,
          MODE() WITHIN GROUP (ORDER BY pt.blended_style_name) as top_profile_name
        FROM registrations r
        LEFT JOIN assessment_attempts a ON a.registration_id = r.id
        LEFT JOIN groups g ON r.group_id = g.id
        LEFT JOIN personality_traits pt ON a.dominant_trait_id = pt.id
        GROUP BY g.id, g.name
        HAVING COUNT(DISTINCT r.id) > 0
      ),
      ranked AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY group_name ORDER BY sample_volume DESC) as rn
        FROM base
        WHERE group_name IS NOT NULL
          AND group_name NOT IN ('CollegeGroup', 'SchoolGroup', 'Unknown Group', '1')
      )
      SELECT * FROM ranked WHERE rn = 1
      ORDER BY is_corporate DESC, has_school_level DESC, sample_volume DESC
    `;

    // 3. DISC distribution per group
    const distQuery = `
      SELECT 
        r.group_id,
        pt.code,
        pt.blended_style_name,
        COUNT(*) as cnt
      FROM assessment_attempts a
      JOIN registrations r ON a.registration_id = r.id
      LEFT JOIN personality_traits pt ON a.dominant_trait_id = pt.id
      WHERE pt.code IS NOT NULL AND r.group_id IS NOT NULL
      GROUP BY r.group_id, pt.code, pt.blended_style_name
      ORDER BY r.group_id, cnt DESC
    `;

    const [results, distResults] = await Promise.all([
      this.dataSource.query(groupQuery),
      this.dataSource.query(distQuery),
    ]);

    // Build distribution lookup
    const distMap: Record<string, { code: string; name: string; count: number }[]> = {};
    for (const d of distResults) {
      const key = `group-${d.group_id}`;
      if (!distMap[key]) distMap[key] = [];
      distMap[key].push({
        code: d.code,
        name: d.blended_style_name || d.code,
        count: parseInt(d.cnt, 10),
      });
    }

    const schools: any[] = [];
    const colleges: any[] = [];
    const corporates: any[] = [];

    for (const row of results) {
      const isCorporate = row.is_corporate === true;
      const isSchool = row.has_school_level === true;
      const entityKey = `group-${row.group_id}`;
      const distribution = distMap[entityKey] || [];

      const entity = {
        id: entityKey,
        name: row.group_name,
        subtitle: isCorporate ? 'Employee' : (isSchool ? 'School Student' : 'College Student'),
        sampleVolume: parseInt(row.sample_volume, 10),
        metrics: [
          { label: 'Assessments Completed', value: parseInt(row.sample_volume, 10) },
          { label: 'Top Profile', value: row.top_profile_code ? `${row.top_profile_code} - ${row.top_profile_name}` : 'N/A' }
        ],
        discDistribution: distribution.map(d => [`${d.code} - ${d.name}`, d.count]),
        connectedTools: ['OriginBI WebApp']
      };

      if (isCorporate) corporates.push(entity);
      else if (isSchool) schools.push(entity);
      else colleges.push(entity);
    }

    return {
      summary: {
        totalSignalsCollected,
        lastUpdated: new Date().toISOString()
      },
      schools: schools,
      colleges: colleges,
      corporates: corporates
    };
  }
}
