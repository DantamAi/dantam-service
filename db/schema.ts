import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
export const tickets = sqliteTable('tickets', {
 id: integer('id').primaryKey({autoIncrement:true}), title:text('title').notNull(), type:text('type').notNull(), status:text('status').notNull(), priority:text('priority').notNull(), product:text('product').notNull().default('Clinic App'), module:text('module').notNull(), assignee:text('assignee').notNull(), description:text('description').notNull(), expected:text('expected').notNull(), actual:text('actual').notNull(), steps:text('steps').notNull(), sourceId:text('source_id').unique(), release:text('release').notNull(), due:text('due').notNull(), created:text('created').notNull(), updated:text('updated').notNull(), version:integer('version').notNull().default(1)
});
export const events = sqliteTable('events', {id:integer('id').primaryKey({autoIncrement:true}), ticketId:integer('ticket_id').notNull().references(()=>tickets.id), action:text('action').notNull(), author:text('author').notNull(), created:text('created').notNull()});
export const attachments=sqliteTable('attachments',{
 id:text('id').primaryKey(),ticketId:integer('ticket_id').notNull().references(()=>tickets.id),objectKey:text('object_key').notNull(),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),caption:text('caption').notNull(),author:text('author').notNull(),created:text('created').notNull()
});

export const catalogOptions=sqliteTable('catalog_options',{key:text('key').primaryKey(),kind:text('kind').notNull(),product:text('product').notNull(),name:text('name').notNull(),author:text('author').notNull(),created:text('created').notNull()});

export const planningProjects=sqliteTable('planning_projects',{
 id:text('id').primaryKey(),version:integer('version').notNull(),data:text('data').notNull()
});

export const workspaceAccess=sqliteTable('workspace_access',{id:text('id').primaryKey(),version:integer('version').notNull(),data:text('data').notNull()});
