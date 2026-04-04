CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"rarity" text DEFAULT 'common',
	"icon" text,
	"points_reward" integer DEFAULT 0,
	"criteria" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "adaptive_learning_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"data_points" jsonb,
	"actionable_recommendations" text[],
	"confidence_level" numeric(3, 2) NOT NULL,
	"importance" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"user_viewed" boolean DEFAULT false,
	"user_feedback" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_memory_facts" (
	"uid" text NOT NULL,
	"fact_id" text NOT NULL,
	"type" text NOT NULL,
	"value" jsonb NOT NULL,
	"source" text NOT NULL,
	"confidence" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "agent_memory_facts_uid_fact_id_pk" PRIMARY KEY("uid","fact_id")
);
--> statement-breakpoint
CREATE TABLE "agent_memory_summaries" (
	"uid" text NOT NULL,
	"period" text NOT NULL,
	"version" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "agent_memory_summaries_uid_period_version_pk" PRIMARY KEY("uid","period","version")
);
--> statement-breakpoint
CREATE TABLE "alarms" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"label" text DEFAULT 'Wellness Reminder',
	"trigger_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" text,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"metric_type" text NOT NULL,
	"value" numeric(10, 4) NOT NULL,
	"calculated_date" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" integer,
	"actor_user_id" integer,
	"actor_type" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" integer,
	"ip_address" text,
	"user_agent" text,
	"session_id" text,
	"success" boolean DEFAULT true NOT NULL,
	"failure_reason" text,
	"data_snapshot" jsonb,
	"change_details" jsonb,
	"access_reason" text,
	"compliance_flags" text[]
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"device_info" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"level" integer DEFAULT 3,
	"personality_mode" text DEFAULT 'companion',
	"voice_id" text DEFAULT 'james',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_privacy_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_user_id" integer NOT NULL,
	"therapist_id" integer NOT NULL,
	"share_journal_data" boolean DEFAULT true,
	"share_mood_data" boolean DEFAULT true,
	"share_reflection_data" boolean DEFAULT true,
	"share_crisis_alerts" boolean DEFAULT true,
	"blur_crisis_flags" boolean DEFAULT false,
	"share_session_summaries" boolean DEFAULT true,
	"data_retention_days" integer DEFAULT 90,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_therapist_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_user_id" integer NOT NULL,
	"therapist_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_code" text,
	"created_at" timestamp DEFAULT now(),
	"activated_at" timestamp,
	CONSTRAINT "client_therapist_relationships_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "community_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"challenge_type" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"target_goal" integer NOT NULL,
	"points_reward" integer DEFAULT 0,
	"participant_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"criteria" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_key" text NOT NULL,
	"title" text,
	"summary" text,
	"key_topics" text[],
	"emotional_tone" text,
	"unresolved_threads" jsonb,
	"context_carryover" jsonb,
	"message_count" integer DEFAULT 0,
	"last_activity" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "conversation_sessions_session_key_unique" UNIQUE("session_key")
);
--> statement-breakpoint
CREATE TABLE "conversation_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" text,
	"summary" text NOT NULL,
	"key_topics" text[],
	"emotional_tone" text,
	"importance" integer DEFAULT 5,
	"message_count" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now(),
	"last_updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" integer,
	"thread_key" text NOT NULL,
	"topic" text NOT NULL,
	"status" text DEFAULT 'active',
	"priority" text DEFAULT 'medium',
	"last_mentioned" timestamp DEFAULT now(),
	"context_summary" text,
	"next_session_prompt" text,
	"related_facts" text[],
	"emotional_context" jsonb,
	"progress_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crisis_detection_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message_content" text NOT NULL,
	"risk_level" text NOT NULL,
	"crisis_indicators" text[],
	"confidence_score" numeric(3, 2) NOT NULL,
	"intervention_triggered" boolean DEFAULT false,
	"intervention_type" text,
	"follow_up_scheduled" boolean DEFAULT false,
	"resolution_status" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_date" timestamp NOT NULL,
	"activity_type" text NOT NULL,
	"activity_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emotional_contexts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" text,
	"current_mood" text NOT NULL,
	"intensity" integer NOT NULL,
	"volatility" numeric(3, 2) NOT NULL,
	"urgency" text NOT NULL,
	"recent_triggers" text[],
	"support_needs" text[],
	"context_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emotional_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"pattern_type" text NOT NULL,
	"analysis" jsonb,
	"confidence" numeric(3, 2),
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emotional_response_adaptations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"original_message" text NOT NULL,
	"adapted_response" text NOT NULL,
	"tone" text NOT NULL,
	"intensity" text NOT NULL,
	"response_length" text NOT NULL,
	"communication_style" text,
	"priority_focus" text[],
	"effectiveness" text,
	"user_response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"forum_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"anonymous_name" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"heart_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"is_moderated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "installs" (
	"adid" text PRIMARY KEY NOT NULL,
	"did_hash" text NOT NULL,
	"platform" text NOT NULL,
	"attested" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"entry_id" integer NOT NULL,
	"insights" text NOT NULL,
	"themes" text[],
	"risk_level" text,
	"recommendations" text[],
	"sentiment_score" numeric(3, 2),
	"emotional_intensity" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text,
	"user_id" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"mood" text,
	"mood_intensity" integer,
	"tags" text[],
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"milestone_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"target_value" integer NOT NULL,
	"current_value" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"celebration_shown" boolean DEFAULT false,
	"icon" text DEFAULT '🎯',
	"color" text DEFAULT 'blue',
	"priority" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "longitudinal_trends" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"trend_type" text NOT NULL,
	"timeframe" text NOT NULL,
	"trend_direction" text NOT NULL,
	"trend_strength" numeric(3, 2),
	"data_points" jsonb,
	"statistical_significance" numeric(3, 2),
	"insights" text,
	"predicted_outcome" text,
	"confidence_interval" jsonb,
	"last_calculated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meditation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meditation_type" text NOT NULL,
	"duration" integer NOT NULL,
	"completed_duration" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"rating" integer,
	"notes" text,
	"ambient_sound" text,
	"voice_enabled" boolean DEFAULT true,
	"selected_voice" text DEFAULT 'amy',
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meditation_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"duration" integer NOT NULL,
	"difficulty" text NOT NULL,
	"guided_steps" jsonb NOT NULL,
	"breathing_pattern" jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "memory_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"from_memory_id" integer NOT NULL,
	"to_memory_id" integer NOT NULL,
	"connection_type" text NOT NULL,
	"strength" numeric(3, 2) DEFAULT '0.50',
	"automatic_connection" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "memory_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insight_type" text NOT NULL,
	"insight" text NOT NULL,
	"supporting_memories" text[],
	"confidence" numeric(3, 2) DEFAULT '0.75',
	"is_shared_with_user" boolean DEFAULT false,
	"user_feedback" text,
	"generated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"bot_id" integer,
	"sender" text,
	"text" text NOT NULL,
	"content" text,
	"is_bot" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_wellness_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"report_month" text NOT NULL,
	"wellness_score" numeric(5, 2),
	"emotional_volatility" numeric(5, 2),
	"progress_summary" text,
	"ai_generated_insights" text,
	"mood_trends" jsonb,
	"activity_metrics" jsonb,
	"therapeutic_progress" jsonb,
	"risk_assessment" jsonb,
	"recommendations" text[],
	"milestones_achieved" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text,
	"user_id" integer NOT NULL,
	"mood" text NOT NULL,
	"intensity" integer NOT NULL,
	"notes" text,
	"triggers" text[],
	"coping_strategies" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mood_forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"forecast_date" timestamp DEFAULT now(),
	"predicted_mood" text NOT NULL,
	"confidence_score" numeric(3, 2) NOT NULL,
	"risk_level" text NOT NULL,
	"trigger_factors" text[],
	"preventive_recommendations" text[],
	"historical_patterns" jsonb,
	"actual_mood" text,
	"forecast_accuracy" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "points_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"activity" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "predictive_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insight" text NOT NULL,
	"probability" numeric(3, 2) NOT NULL,
	"timeframe" text NOT NULL,
	"preventive_actions" text[],
	"risk_mitigation" text[],
	"is_active" boolean DEFAULT true,
	"was_accurate" boolean,
	"user_feedback" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "progress_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"metric_type" text NOT NULL,
	"value" integer NOT NULL,
	"date" timestamp DEFAULT now(),
	"weekly_average" numeric(5, 2),
	"monthly_total" integer,
	"trend" text,
	"achievements" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "progress_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tracking_period" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"journal_entries" integer DEFAULT 0,
	"mood_entries" integer DEFAULT 0,
	"chat_sessions" integer DEFAULT 0,
	"goals_completed" integer DEFAULT 0,
	"average_mood_score" numeric(3, 2),
	"consistency_score" numeric(3, 2),
	"therapeutic_engagement" numeric(3, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rewards_shop" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"cost" integer NOT NULL,
	"rarity" text DEFAULT 'common',
	"is_available" boolean DEFAULT true,
	"therapeutic_value" text,
	"image_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_user_id" integer NOT NULL,
	"therapist_id" integer NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"trigger_data" jsonb,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"assessment_date" timestamp NOT NULL,
	"risk_level" text NOT NULL,
	"risk_score" numeric(3, 2) NOT NULL,
	"risk_factors" text[],
	"protective_factors" text[],
	"recommendations" text[],
	"trigger_events" jsonb,
	"follow_up_required" boolean DEFAULT false,
	"ai_analysis" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "semantic_memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"memory_type" text NOT NULL,
	"content" text NOT NULL,
	"semantic_tags" text[],
	"emotional_context" text,
	"temporal_context" text,
	"related_topics" text[],
	"confidence" numeric(3, 2) DEFAULT '0.85',
	"access_count" integer DEFAULT 0,
	"last_accessed_at" timestamp,
	"source_conversation_id" integer,
	"is_active_memory" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_continuity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"from_session_id" integer NOT NULL,
	"to_session_id" integer NOT NULL,
	"continuity_type" text NOT NULL,
	"carryover_data" jsonb,
	"priority" integer DEFAULT 1,
	"addressed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" uuid PRIMARY KEY NOT NULL,
	"adid" text NOT NULL,
	"uid" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"revoked" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "support_forums" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"member_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "therapeutic_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"target_value" integer DEFAULT 100,
	"current_value" integer DEFAULT 0,
	"unit" text DEFAULT 'percent',
	"start_date" timestamp DEFAULT now(),
	"target_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "therapist_session_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"therapist_id" integer NOT NULL,
	"client_user_id" integer NOT NULL,
	"session_date" timestamp NOT NULL,
	"notes" text,
	"recommendations" text,
	"risk_assessment" text,
	"follow_up_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"license_number" text NOT NULL,
	"specialty" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "therapists_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now(),
	"progress" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"celebration_shown" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_challenge_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"current_progress" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"points_earned" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"uid" text NOT NULL,
	"adid" text NOT NULL,
	"udid" text NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now(),
	"last_seen" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_devices_uid_adid_pk" PRIMARY KEY("uid","adid"),
	CONSTRAINT "user_devices_udid_unique" UNIQUE("udid")
);
--> statement-breakpoint
CREATE TABLE "user_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"fact" text NOT NULL,
	"category" text DEFAULT 'general',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"feedback_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"rating" integer,
	"admin_response" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" integer NOT NULL,
	"name" text NOT NULL,
	"points_required" integer NOT NULL,
	"badge" text,
	"benefits" jsonb,
	"description" text,
	CONSTRAINT "user_levels_level_unique" UNIQUE("level")
);
--> statement-breakpoint
CREATE TABLE "user_memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"memory" text NOT NULL,
	"importance" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"communication_style" text NOT NULL,
	"emotional_support" text NOT NULL,
	"preferred_tone" text NOT NULL,
	"primary_goals" text[],
	"stress_responses" text[],
	"motivation_factors" text[],
	"session_preference" text NOT NULL,
	"personality_traits" text[],
	"quiz_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reward_id" integer NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"streak_type" text NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"streak_start_date" timestamp,
	"total_active_days" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_wellness_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_points" integer DEFAULT 0,
	"available_points" integer DEFAULT 0,
	"lifetime_points" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"points_to_next_level" integer DEFAULT 100,
	"last_activity_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"password_hash" text,
	"display_name" text,
	"session_id" text,
	"session_token" text,
	"device_fingerprint" text,
	"ip_address" text,
	"user_agent" text,
	"security_level" text DEFAULT 'MEDIUM',
	"is_active" boolean DEFAULT true,
	"is_anonymous" boolean DEFAULT false,
	"onboarding_completed" boolean DEFAULT false,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"subscription_status" text DEFAULT 'free',
	"subscription_id" text,
	"customer_id" text,
	"subscription_expires_at" timestamp,
	"monthly_usage" integer DEFAULT 0,
	"last_usage_reset" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "voluntary_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"question_id" text NOT NULL,
	"category_id" text NOT NULL,
	"answer" text NOT NULL,
	"answered_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vr_accessibility_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"motion_sensitivity" text DEFAULT 'medium',
	"audio_descriptions" boolean DEFAULT false,
	"high_contrast" boolean DEFAULT false,
	"simplified_controls" boolean DEFAULT false,
	"comfort_settings" jsonb,
	"visual_adjustments" jsonb,
	"audio_preferences" jsonb,
	"trigger_warnings" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vr_environments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"environment_type" text NOT NULL,
	"therapeutic_focus" text NOT NULL,
	"difficulty_level" integer DEFAULT 1,
	"duration_minutes" integer DEFAULT 15,
	"scene_path" text,
	"audio_path" text,
	"instructions" text[],
	"therapeutic_goals" text[],
	"contraindications" text[],
	"vr_settings" jsonb,
	"accessibility" jsonb,
	"tags" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vr_progress_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"environment_id" integer NOT NULL,
	"total_sessions" integer DEFAULT 0,
	"total_duration" integer DEFAULT 0,
	"average_effectiveness" numeric(3, 2),
	"best_effectiveness_rating" integer,
	"average_stress_reduction" numeric(3, 2),
	"skill_development_level" integer DEFAULT 1,
	"milestones_achieved" text[],
	"last_session_date" timestamp,
	"streak_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vr_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"environment_id" integer NOT NULL,
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"duration_minutes" integer,
	"completion_status" text NOT NULL,
	"effectiveness_rating" integer,
	"stress_level_before" integer,
	"stress_level_after" integer,
	"heart_rate_data" jsonb,
	"session_goals" text[],
	"personalized_settings" jsonb,
	"insights" jsonb,
	"side_effects" text[],
	"therapeutic_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vr_therapeutic_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_name" text NOT NULL,
	"therapeutic_goals" text[],
	"recommended_environments" jsonb,
	"duration_weeks" integer DEFAULT 4,
	"progress_metrics" jsonb,
	"adaptation_rules" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wellness_journey_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"emotional_context" jsonb,
	"significance" integer DEFAULT 5,
	"related_milestones" text[],
	"celebration_level" text DEFAULT 'standard',
	"celebration_shown" boolean DEFAULT false,
	"user_reflection" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wellness_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"streak_type" text NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_adid_installs_adid_fk" FOREIGN KEY ("adid") REFERENCES "public"."installs"("adid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_adid_installs_adid_fk" FOREIGN KEY ("adid") REFERENCES "public"."installs"("adid") ON DELETE no action ON UPDATE no action;