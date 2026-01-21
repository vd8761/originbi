package service

import (
	"exam-engine/internal/models"
	"exam-engine/internal/repository"
	"time"
)

// StartScheduler initializes the background job ticker
func StartScheduler() {
	ticker := time.NewTicker(2 * time.Minute) // Check every 2 minutes for timely updates
	go func() {
		for {
			select {
			case <-ticker.C:
				ExpireAttempts()
				ExpireSessions()
				ExpireGroupAssessments()
			}
		}
	}()
}

// ExpireAttempts updates the status of expired attempts
func ExpireAttempts() {
	db := repository.GetDB()
	if db == nil {
		return
	}

	now := time.Now()

	// 1. Mark NOT_STARTED attempts as EXPIRED if past expires_at
	db.Model(&models.AssessmentAttempt{}).
		Where("status = ? AND expires_at < ?", "NOT_STARTED", now).
		Update("status", "EXPIRED")

	// 2. Mark IN_PROGRESS attempts as PARTIALLY_EXPIRED if past expires_at
	//    Ideally, if an exam is strictly timed, the system should submit it.
	//    But as a fail-safe, we mark it partially expired or completed depending on business logic.
	//    The requirement says: "if exam is in progress and date is expired => partially_expired"
	db.Model(&models.AssessmentAttempt{}).
		Where("status = ? AND expires_at < ?", "IN_PROGRESS", now).
		Update("status", "PARTIALLY_EXPIRED")
}

// ExpireSessions updates the status of sessions based on valid_to
func ExpireSessions() {
	db := repository.GetDB()
	if db == nil {
		return
	}

	now := time.Now()

	// Find active sessions that have expired
	// We only look at session statuses that are NOT already terminal/expired to avoid re-work
	// But PARTIALLY_EXPIRED is a terminal state too? If valid_to is passed, it's final.
	var expiredSessionIDs []int64
	db.Model(&models.AssessmentSession{}).
		Where("valid_to < ? AND status NOT IN (?, ?, ?)", now, "COMPLETED", "EXPIRED", "PARTIALLY_EXPIRED").
		Pluck("id", &expiredSessionIDs)

	if len(expiredSessionIDs) == 0 {
		return
	}

	for _, sessionID := range expiredSessionIDs {
		// Check attempts for this session
		var stats struct {
			Total     int64
			Started   int64
			Completed int64
		}

		db.Model(&models.AssessmentAttempt{}).
			Where("assessment_session_id = ?", sessionID).
			Select("COUNT(*) as total, COUNT(*) FILTER (WHERE status != 'NOT_STARTED') as started, COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed").
			Scan(&stats)

		newStatus := "EXPIRED"
		if stats.Started > 0 || stats.Completed > 0 {
			newStatus = "PARTIALLY_EXPIRED"
		}

		db.Model(&models.AssessmentSession{}).
			Where("id = ?", sessionID).
			Update("status", newStatus)
	}
}

// ExpireGroupAssessments updates group statuses
func ExpireGroupAssessments() {
	db := repository.GetDB()
	if db == nil {
		return
	}

	now := time.Now()

	// Find active groups that have expired
	var expiredGroupIDs []int64
	// GroupAssessment struct is needed to locate table name, usually group_assessments
	db.Model(&models.GroupAssessment{}).
		Where("valid_to < ? AND status NOT IN (?, ?, ?)", now, "COMPLETED", "EXPIRED", "PARTIALLY_EXPIRED").
		Pluck("id", &expiredGroupIDs)

	if len(expiredGroupIDs) == 0 {
		return
	}

	for _, groupID := range expiredGroupIDs {
		// Check individual sessions within this group
		// We need to see if ANYONE started
		var stats struct {
			Started int64
		}

		// Count sessions that are NOT 'NOT_STARTED'
		db.Model(&models.AssessmentSession{}).
			Where("group_id = ? AND status != ?", groupID, "NOT_STARTED").
			Count(&stats.Started)

		newStatus := "EXPIRED"
		if stats.Started > 0 {
			newStatus = "PARTIALLY_EXPIRED"
		}

		db.Model(&models.GroupAssessment{}).
			Where("id = ?", groupID).
			Update("status", newStatus)
	}
}
