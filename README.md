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

You can now use `pg-upgrade-schema` to pass in upgrade scripts to upgrade the database.

All your upgrade scripts must be in a directory. The only thing allowed in that directory is upgrade scripts. An upgrade script must start with the version number (but can be prefixed with 0s for lexical sorting).

An upgrade script can be .sql which is executed againt the db. Or it can be a .js or .ts file, which is imported and the default exported function will be called with a PgClient passed in as the first argument. If it returns a string, that is also executed.

See: /example directory

Tips:

- In your npm scripts add something like:

```
{
   "pg_dump": "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump --schema-only -d yourdbname > schema.sql"
}
```

So you have a schema.sql file, which you can commit. And then you can diff.

-
