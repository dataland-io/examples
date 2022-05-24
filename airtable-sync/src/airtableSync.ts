// This is a template that reads all records in an Airtable base. If the record already exists in
// the imported records table in Dataland, then the worker will update the Dataland row. If the record does not exist,
// then this worker will insert it into Dataland.

// Search for the string "TODO" to find the places where you need to change things in this file.

import { isString } from "lodash-es";
import {
  getCatalogSnapshot,
  getEnv,
  Mutation,
  KeyGenerator,
  OrdinalGenerator,
  querySqlSnapshot,
  registerTransactionHandler,
  runMutations,
  Schema,
  Transaction,
  unpackRows,
} from "@dataland-io/dataland-sdk-worker";

// TODO: Make sure to declare your Airtable API Key in the .env file and also declare the parameter in spec.yaml.
// This template assumes the .env variable is declared as `DL_PARAM_AIRTABLE_API_KEY`.
// See the tutorial for using environment variables here: {link}
const airtable_api_key = getEnv("AIRTABLE_API_KEY");

if (airtable_api_key == null) {
  throw new Error("Missing environment variable - AIRTABLE_API_KEY");
}

// TODO: Update the URL to the API endpoint of your Airtable table below.
// The endpoint format is https://api.airtable.com/v0/<BASE_ID>/<TABLE_NAME>

const airtable_url_base =
  "https://api.airtable.com/v0/appN1FQpWEfIWXvZP/Example";

const readFromAirtable = async () => {
  var headers = new Headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded");
  headers.append("Authorization", "Bearer " + airtable_api_key);

  const full_records = [];

  let url = airtable_url_base;
  let offset = "";

  do {
    const airtable_response = await fetch(url, {
      method: "GET",
      headers: headers,
      redirect: "follow",
    });
    const data = await airtable_response.json();
    const records = data.records;

    if (records) {
      for (const record of records) {
        full_records.push(record);
      }
    }

    offset = data.offset;
    url = airtable_url_base + "&offset=" + offset;
    console.log("processed row count: ", full_records.length);
  } while (offset);

  return full_records;
};

const handler = async (transaction: Transaction) => {
  const { tableDescriptors } = await getCatalogSnapshot({
    logicalTimestamp: transaction.logicalTimestamp,
  });

  const schema = new Schema(tableDescriptors);

  // TODO: If you're using a different table name than "Airtable Sync Trigger" and different column name than "Trigger sync",
  // update the below arguments. Also make sure this is reflected in spec.yaml as well.
  const affectedRows = schema.getAffectedRows(
    "Airtable Sync Trigger",
    "Trigger sync",
    transaction
  );

  const lookupKeys: number[] = [];
  for (const [key, value] of affectedRows) {
    if (typeof value === "number") {
      lookupKeys.push(key);
    }
  }

  if (lookupKeys.length === 0) {
    return;
  }
  const keyList = `(${lookupKeys.join(",")})`;

  // TODO: If trigger table name != "Airtable Sync Trigger", update the table name in the SQL query below.
  const response = await querySqlSnapshot({
    logicalTimestamp: transaction.logicalTimestamp,
    sqlQuery: `select
      _dataland_key
    from "Airtable Sync Trigger"
    where _dataland_key in ${keyList}`,
  });

  const trigger_rows = unpackRows(response);

  const keyGenerator = new KeyGenerator();
  const ordinalGenerator = new OrdinalGenerator();

  const mutations: Mutation[] = [];
  for (const trigger_row of trigger_rows) {
    const key = Number(trigger_row["_dataland_key"]);

    // TODO: If trigger table name != "Airtable Sync Trigger", update the table name below.
    const update = schema.makeUpdateRows("Airtable Sync Trigger", key, {
      "Last pressed": new Date().toISOString(),
    });

    if (update == null) {
      console.log("No update found");
      continue;
    }
    mutations.push(update);
  }

  // TODO: If imported records table name != "Records from Airtable", update the table name below.
  const existingTable = await querySqlSnapshot({
    logicalTimestamp: transaction.logicalTimestamp,
    sqlQuery: `select *
    from "Records from Airtable"`,
  });

  const existing_rows = unpackRows(existingTable);

  let data_id_key_pairs: any = {};

  const existingIds = new Set<string>();
  for (const row of existing_rows) {
    // This is the Record ID generated by Airtable
    const id = row["Record ID"];
    if (!isString(id)) {
      continue;
    }
    existingIds.add(id);
    data_id_key_pairs[id] = row["_dataland_key"];
  }

  const syntheticKey = await keyGenerator.nextKey();
  const airtable_records = await readFromAirtable();

  for (const airtable_record of airtable_records) {
    const airtable_record_id = airtable_record.id;

    //TODO:
    const airtable_record_customer_id = airtable_record.fields["Customer ID"];
    const airtable_record_email = airtable_record.fields["Email"];
    const airtable_record_phone = airtable_record.fields["Phone"];

    // If ID exists, update the existing values for this record
    if (existingIds.has(airtable_record_id)) {
      const existing_key = data_id_key_pairs[airtable_record_id];

      const update = schema.makeUpdateRows(
        "Records from Airtable",
        existing_key,
        {
          _dataland_ordinal: String(existing_key),
          "Record ID": airtable_record_id,
          "Customer ID": airtable_record_customer_id,
          Email: airtable_record_email,
          Phone: airtable_record_phone,
        }
      );

      if (update == null) {
        continue;
      }
      mutations.push(update);
    } else {
      // Otherwise, insert a new record
      const id = await keyGenerator.nextKey();
      const ordinal = await ordinalGenerator.nextOrdinal();
      const insert = schema.makeInsertRows("Records from Airtable", id, {
        _dataland_ordinal: ordinal,
        "Record ID": airtable_record_id,
        "Customer ID": airtable_record_customer_id,
        Email: airtable_record_email,
        Phone: airtable_record_phone,
      });

      if (insert == null) {
        continue;
      }
      mutations.push(insert);
    }
  }
  await runMutations({ mutations });
};

registerTransactionHandler(handler);
