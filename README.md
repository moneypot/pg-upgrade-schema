## A simple library to help you manage postgres schema versions

pg-upgrade-schema is designed to be the simplest possible library to help you manage upgrading
your postgres schema.

It will start off by creating a table:

```
    CREATE TABLE pg_upgrade_schema_versions(
      version     int           NOT NULL PRIMARY KEY,
      updated_at  timestamptz   NOT NULL DEFAULT clock_timestamp()
    );
    INSERT INTO pg_upgrade_schema_versions(version) VALUES(0);
```

Which will track all the upgrades of the database.

You can now use `PgUpgradeSchema.ensure` to pass in upgrade scripts to upgrade the database.
The first version must be 1 and increase by 1 after that. Each upgrade script can be a string (which is executed as SQL), or can be a function (which takes a PgClient) and if it returns a string that string is executed as SQL.

See: /example directory

Tips:

- In your npm scripts add something like:

```
{
   "pg_dump": "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump --schema-only -d yourdbname > schema.sql"
}
```

So you have a schema.sql file you can diff and look at
