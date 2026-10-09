import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterApp } from '@originbi/shared-entities';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(MasterApp)
    private masterAppRepository: Repository<MasterApp>,
  ) {}

  async findAll() {
    return this.masterAppRepository.find({
      order: { display_name: 'ASC' },
    });
  }

  async toggleStatus(id: string, is_globally_active: boolean) {
    const app = await this.masterAppRepository.findOne({ where: { id } });
    if (!app) {
      throw new NotFoundException(`Integration provider with ID ${id} not found`);
    }

    app.is_globally_active = is_globally_active;
    return this.masterAppRepository.save(app);
  }

  // Utility to seed initial apps if needed
  async createInitialApps() {
    const apps = [
      { name: 'slack', display_name: 'Slack', is_globally_active: false, features: { scopes: ['chat:write'] } },
      { name: 'google_drive', display_name: 'Google Drive', is_globally_active: false, features: { scopes: ['drive.readonly'] } },
      { name: 'jira', display_name: 'Atlassian Jira', is_globally_active: false, features: { scopes: ['read:jira-work'] } },
      { name: 'salesforce', display_name: 'Salesforce', is_globally_active: false, features: { scopes: ['api'] } },
      { name: 'hubspot', display_name: 'HubSpot', is_globally_active: false, features: { scopes: ['contacts'] } },
      { name: 'microsoft_teams', display_name: 'Microsoft Teams', is_globally_active: false, features: { scopes: ['TeamsActivity.Read'] } },
      { name: 'notion', display_name: 'Notion', is_globally_active: false, features: { scopes: ['read'] } },
      { name: 'zoom', display_name: 'Zoom', is_globally_active: false, features: { scopes: ['meeting:read'] } },
      { name: 'github', display_name: 'GitHub', is_globally_active: false, features: { scopes: ['repo'] } },
      { name: 'clickup', display_name: 'ClickUp', is_globally_active: false, features: { scopes: ['tasks'] } },
      { name: 'zoho_crm', display_name: 'Zoho CRM', is_globally_active: false, features: { scopes: ['ZohoCRM.modules.ALL'] } },
      { name: 'asana', display_name: 'Asana', is_globally_active: false, features: { scopes: ['default'] } },
      { name: 'trello', display_name: 'Trello', is_globally_active: false, features: { scopes: ['read', 'write'] } },
      { name: 'monday', display_name: 'Monday.com', is_globally_active: false, features: { scopes: ['me:read'] } },
      { name: 'zendesk', display_name: 'Zendesk', is_globally_active: false, features: { scopes: ['read'] } },
      { name: 'freshdesk', display_name: 'Freshdesk', is_globally_active: false, features: { scopes: ['read'] } },
      { name: 'gitlab', display_name: 'GitLab', is_globally_active: false, features: { scopes: ['api'] } },
      { name: 'bitbucket', display_name: 'Bitbucket', is_globally_active: false, features: { scopes: ['repository'] } },
      { name: 'workday', display_name: 'Workday', is_globally_active: false, features: { scopes: ['staffing'] } },
      { name: 'bamboohr', display_name: 'BambooHR', is_globally_active: false, features: { scopes: ['employee:read'] } },
      { name: 'gusto', display_name: 'Gusto', is_globally_active: false, features: { scopes: ['payroll:read'] } },
      { name: 'deel', display_name: 'Deel', is_globally_active: false, features: { scopes: ['contracts:read'] } },
      { name: 'adp', display_name: 'ADP', is_globally_active: false, features: { scopes: ['hr.workerInformation.read'] } },
      { name: 'rippling', display_name: 'Rippling', is_globally_active: false, features: { scopes: ['employees:read'] } },
      { name: 'zenro_payroll', display_name: 'Zenro Payroll', is_globally_active: false, features: { scopes: ['mysql:read'] } },
    ];

    for (const app of apps) {
      const exists = await this.masterAppRepository.findOne({ where: { name: app.name } });
      if (!exists) {
        await this.masterAppRepository.save(app);
      }
    }
    return { message: 'Initial apps seeded' };
  }
}
