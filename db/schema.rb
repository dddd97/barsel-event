# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_08_02_100000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "admins", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "super_admin", default: false
    t.integer "role", default: 0, null: false
    t.string "avatar"
    t.index ["email"], name: "index_admins_on_email", unique: true
    t.index ["role"], name: "index_admins_on_role"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.bigint "admin_id", null: false
    t.string "action", null: false
    t.string "resource_type"
    t.integer "resource_id"
    t.text "details"
    t.string "ip_address", null: false
    t.string "user_agent", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action", "created_at"], name: "index_audit_logs_on_action_and_created_at"
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["admin_id", "created_at"], name: "index_audit_logs_on_admin_id_and_created_at"
    t.index ["admin_id"], name: "index_audit_logs_on_admin_id"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["resource_type", "resource_id"], name: "index_audit_logs_on_resource_type_and_resource_id"
  end

  create_table "event_sequences", force: :cascade do |t|
    t.integer "next_sequence_number", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "events", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.date "date"
    t.string "location"
    t.boolean "is_active"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "event_date"
    t.string "category", default: "regular"
    t.bigint "creator_id"
    t.datetime "registration_start"
    t.datetime "registration_end"
    t.integer "max_participants"
    t.integer "participants_count", default: 0, null: false
    t.integer "sequence_number"
    t.string "contact_person1_name"
    t.string "contact_person1_phone"
    t.string "contact_person2_name"
    t.string "contact_person2_phone"
    t.time "start_time"
    t.index ["category"], name: "index_events_on_category"
    t.index ["creator_id"], name: "index_events_on_creator_id"
    t.index ["event_date"], name: "index_events_on_event_date"
    t.index ["registration_end"], name: "index_events_on_registration_end"
    t.index ["registration_start"], name: "index_events_on_registration_start"
    t.index ["sequence_number"], name: "index_events_on_sequence_number", unique: true
    t.index ["updated_at"], name: "index_events_on_updated_at"
  end

  create_table "forfeitures", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "participant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "participant_id"], name: "index_forfeitures_on_event_id_and_participant_id", unique: true
    t.index ["event_id"], name: "index_forfeitures_on_event_id"
    t.index ["participant_id"], name: "index_forfeitures_on_participant_id"
  end

  create_table "good_job_batches", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.jsonb "serialized_properties"
    t.text "on_finish"
    t.text "on_success"
    t.text "on_discard"
    t.text "callback_queue_name"
    t.integer "callback_priority"
    t.datetime "enqueued_at"
    t.datetime "discarded_at"
    t.datetime "finished_at"
    t.datetime "jobs_finished_at"
  end

  create_table "good_job_executions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "active_job_id", null: false
    t.text "job_class"
    t.text "queue_name"
    t.jsonb "serialized_params"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.text "error"
    t.integer "error_event", limit: 2
    t.text "error_backtrace", array: true
    t.uuid "process_id"
    t.interval "duration"
    t.index ["active_job_id", "created_at"], name: "index_good_job_executions_on_active_job_id_and_created_at"
    t.index ["process_id", "created_at"], name: "index_good_job_executions_on_process_id_and_created_at"
  end

  create_table "good_job_processes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "state"
    t.integer "lock_type", limit: 2
  end

  create_table "good_job_settings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "key"
    t.jsonb "value"
    t.index ["key"], name: "index_good_job_settings_on_key", unique: true
  end

  create_table "good_jobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "queue_name"
    t.integer "priority"
    t.jsonb "serialized_params"
    t.datetime "scheduled_at"
    t.datetime "performed_at"
    t.datetime "finished_at"
    t.text "error"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "active_job_id"
    t.text "concurrency_key"
    t.text "cron_key"
    t.uuid "retried_good_job_id"
    t.datetime "cron_at"
    t.uuid "batch_id"
    t.uuid "batch_callback_id"
    t.boolean "is_discrete"
    t.integer "executions_count"
    t.text "job_class"
    t.integer "error_event", limit: 2
    t.text "labels", array: true
    t.uuid "locked_by_id"
    t.datetime "locked_at"
    t.index ["active_job_id", "created_at"], name: "index_good_jobs_on_active_job_id_and_created_at"
    t.index ["batch_callback_id"], name: "index_good_jobs_on_batch_callback_id", where: "(batch_callback_id IS NOT NULL)"
    t.index ["batch_id"], name: "index_good_jobs_on_batch_id", where: "(batch_id IS NOT NULL)"
    t.index ["concurrency_key", "created_at"], name: "index_good_jobs_on_concurrency_key_and_created_at"
    t.index ["concurrency_key"], name: "index_good_jobs_on_concurrency_key_when_unfinished", where: "(finished_at IS NULL)"
    t.index ["cron_key", "created_at"], name: "index_good_jobs_on_cron_key_and_created_at_cond", where: "(cron_key IS NOT NULL)"
    t.index ["cron_key", "cron_at"], name: "index_good_jobs_on_cron_key_and_cron_at_cond", unique: true, where: "(cron_key IS NOT NULL)"
    t.index ["finished_at"], name: "index_good_jobs_jobs_on_finished_at", where: "((retried_good_job_id IS NULL) AND (finished_at IS NOT NULL))"
    t.index ["labels"], name: "index_good_jobs_on_labels", where: "(labels IS NOT NULL)", using: :gin
    t.index ["locked_by_id"], name: "index_good_jobs_on_locked_by_id", where: "(locked_by_id IS NOT NULL)"
    t.index ["priority", "created_at"], name: "index_good_job_jobs_for_candidate_lookup", where: "(finished_at IS NULL)"
    t.index ["priority", "created_at"], name: "index_good_jobs_jobs_on_priority_created_at_when_unfinished", order: { priority: "DESC NULLS LAST" }, where: "(finished_at IS NULL)"
    t.index ["priority", "scheduled_at"], name: "index_good_jobs_on_priority_scheduled_at_unfinished_unlocked", where: "((finished_at IS NULL) AND (locked_by_id IS NULL))"
    t.index ["queue_name", "scheduled_at"], name: "index_good_jobs_on_queue_name_and_scheduled_at", where: "(finished_at IS NULL)"
    t.index ["scheduled_at"], name: "index_good_jobs_on_scheduled_at", where: "(finished_at IS NULL)"
  end

  create_table "participants", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.string "name"
    t.string "nik"
    t.string "phone_number"
    t.datetime "registered_at"
    t.integer "draw_number"
    t.boolean "winner"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "participant_number"
    t.string "email"
    t.string "phone"
    t.string "registration_number"
    t.string "institution"
    t.index ["created_at"], name: "index_participants_on_created_at"
    t.index ["event_id", "created_at"], name: "index_participants_on_event_and_date"
    t.index ["event_id", "nik"], name: "index_participants_on_event_id_and_nik", unique: true
    t.index ["event_id", "registration_number"], name: "index_participants_on_event_id_and_registration_number", unique: true
    t.index ["event_id"], name: "index_participants_on_event_id"
    t.index ["registration_number"], name: "index_participants_on_reg_number"
  end

  create_table "prizes", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.string "name"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "quantity", default: 1, null: false
    t.string "category", default: "regular"
    t.index ["category"], name: "index_prizes_on_category"
    t.index ["event_id"], name: "index_prizes_on_event_id"
  end

  create_table "winnings", force: :cascade do |t|
    t.bigint "prize_id", null: false
    t.bigint "participant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_winnings_on_created_at"
    t.index ["participant_id", "prize_id"], name: "index_winnings_on_participant_and_prize_unique", unique: true
    t.index ["participant_id"], name: "index_winnings_on_participant_id"
    t.index ["prize_id"], name: "index_winnings_on_prize_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "audit_logs", "admins"
  add_foreign_key "events", "admins", column: "creator_id"
  add_foreign_key "forfeitures", "events"
  add_foreign_key "forfeitures", "participants"
  add_foreign_key "participants", "events"
  add_foreign_key "prizes", "events"
  add_foreign_key "winnings", "participants"
  add_foreign_key "winnings", "prizes"
end
