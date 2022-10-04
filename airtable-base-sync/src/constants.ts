import { getEnv } from "@dataland-io/dataland-sdk-worker";

export const SYNC_TABLES_MARKER =
  "airtable-table-sync.workers.dataland.io/cron-sync-marker";
export const RECORD_ID = "record-id";

export const DATALAND_TABLE_NAME = getEnv("DATALAND_TABLE_NAME");

export const AIRTABLE_API_KEY = getEnv("AIRTABLE_API_KEY");
// export const AIRTABLE_BASE_ID = getEnv("AIRTABLE_BASE_ID");
// export const AIRTABLE_TABLE_NAME = getEnv("AIRTABLE_TABLE_NAME");
// export const AIRTABLE_VIEW_NAME = getEnv("AIRTABLE_VIEW_NAME");
export const ALLOW_WRITEBACK_BOOLEAN = getEnv("ALLOW_WRITEBACK_BOOLEAN");
export const AIRTABLE_FIELDS_LIST = getEnv("AIRTABLE_FIELDS_LIST");
export const AIRTABLE_BASE_JSON = getEnv("AIRTABLE_BASE_JSON");
