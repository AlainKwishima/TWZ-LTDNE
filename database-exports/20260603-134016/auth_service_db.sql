--
-- PostgreSQL database dump
--

\restrict hlNFapb9eKWEBJ0XFXS2t8E5ajbtgzzFEUFETf7GBxxqIJyyahQqBixZuSDPIcF

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditAction" AS ENUM (
    'SIGNUP',
    'LOGIN',
    'LOGIN_FAILED',
    'LOGOUT',
    'OTP_SENT',
    'OTP_VERIFIED',
    'OTP_FAILED',
    'PASSWORD_RESET_REQUESTED',
    'PASSWORD_RESET_COMPLETED',
    'PROFILE_UPDATED',
    'ACCOUNT_DEACTIVATED'
);


--
-- Name: OtpPurpose; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OtpPurpose" AS ENUM (
    'signup',
    'login',
    'password_reset',
    'purchase',
    'sensitive_action'
);


--
-- Name: RoleName; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RoleName" AS ENUM (
    'Admin',
    'Staff',
    'Inspector',
    'User'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: auth_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_audit_logs (
    id text NOT NULL,
    user_id text,
    action public."AuditAction" NOT NULL,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otps (
    id text NOT NULL,
    user_id text NOT NULL,
    destination text NOT NULL,
    code_hash text NOT NULL,
    purpose public."OtpPurpose" NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    verified_at timestamp(3) without time zone,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    user_id text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    used_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name public."RoleName" NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id text NOT NULL,
    role_id text NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text,
    phone_number text,
    is_email_verified boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    customer_id text,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    google_id text,
    first_name text NOT NULL,
    last_name text NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
29ae9f05-72f8-4ce0-b595-8edcddb0fb5c	7ad8e13f4a2c3ede31dcc67266756e74973ce4486e75ad5cd8eabb70c9f55dc5	2026-05-31 21:35:31.415665+00	20250530000000_init	\N	\N	2026-05-31 21:35:31.287825+00	1
ee454ad4-a3ca-46f7-8e20-42d432d66cbd	ba4686e9c7fb0cba68586ddd4da3c49a74a3e1bc148df935bfa55893d25a0902	2026-05-31 21:35:31.452978+00	20250530120000_add_google_auth	\N	\N	2026-05-31 21:35:31.419634+00	1
ed7f9702-3c2e-4b88-8934-911e7b0e5592	d851edb58cfbd1a789cfa062cdaffeb8a290bac79681dc6409cd5288982913ef	\N	20250601000000_rename_roles	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250601000000_rename_roles\n\nDatabase error code: 42883\n\nDatabase error:\nERROR: operator does not exist: text = uuid\nHINT: No operator matches the given name and argument types. You might need to add explicit type casts.\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42883), message: "operator does not exist: text = uuid", detail: None, hint: Some("No operator matches the given name and argument types. You might need to add explicit type casts."), position: Some(Internal { position: 56, query: "UPDATE user_roles SET role_id = admin_id WHERE role_id = staff_id" }), where_: Some("PL/pgSQL function inline_code_block line 9 at SQL statement"), schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_oper.c"), line: Some(647), routine: Some("op_error") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250601000000_rename_roles"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250601000000_rename_roles"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2026-06-03 07:43:35.855616+00	2026-06-03 07:42:35.847961+00	0
a7b39987-31fb-4560-b1c0-cd006fb87f06	4f1f7424164ae3aeed1c244985d64be09477e762e77713f1346b56d9bc4606ae	\N	20250601000000_rename_roles	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250601000000_rename_roles\n\nDatabase error code: 42883\n\nDatabase error:\nERROR: operator does not exist: text = uuid\nHINT: No operator matches the given name and argument types. You might need to add explicit type casts.\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42883), message: "operator does not exist: text = uuid", detail: None, hint: Some("No operator matches the given name and argument types. You might need to add explicit type casts."), position: Some(Internal { position: 56, query: "UPDATE user_roles SET role_id = admin_id WHERE role_id = staff_id" }), where_: Some("PL/pgSQL function inline_code_block line 9 at SQL statement"), schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_oper.c"), line: Some(647), routine: Some("op_error") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250601000000_rename_roles"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20250601000000_rename_roles"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2026-06-03 07:44:12.017988+00	2026-06-03 07:43:38.69145+00	0
e5933797-a5c1-488b-9d0e-45bcad515bc2	92670fab1728eca61e5ebb61902e7dc5536afe16921890391cebb2dcb2cae275	2026-06-03 07:44:15.407596+00	20250601000000_rename_roles	\N	\N	2026-06-03 07:44:15.358281+00	1
16ec32b8-edb2-42e0-a4f7-6e8a7a184643	ddb63f3d8cc662ba1794552403cb95d53c652d6d4be6fb12f624efb5b4936937	2026-06-03 11:20:15.525367+00	20260603000000_user_first_last_name	\N	\N	2026-06-03 11:20:15.426956+00	1
\.


--
-- Data for Name: auth_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_audit_logs (id, user_id, action, ip_address, user_agent, metadata, created_at) FROM stdin;
d8f255dc-aef7-48de-af98-d12b0cb6a510	cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	LOGIN	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	\N	2026-05-31 21:39:52.52
0fe11109-fc19-46a1-a33c-9dfc1bc7c7b0	cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	LOGIN	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	\N	2026-05-31 21:41:52.308
a45ea645-0176-495a-83f3-73d26eedf65e	ccf69344-92d2-485e-a489-5c50574c40e6	LOGIN	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	\N	2026-05-31 21:41:53.436
59dd3d88-d07c-4d27-a5e0-3352b2cae5ff	cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	\N	2026-05-31 21:52:02.554
4dcd0e44-9ce0-4a1a-a15c-93bd2c9cd0a5	6c4dbe3b-d9b0-4bc3-939c-2daa3b15427f	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	\N	2026-05-31 21:53:02.267
666f0c23-c12b-4de8-86ea-4c81794e990e	1e928f00-8a58-471e-a72c-ca780c43ac16	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	\N	2026-05-31 21:53:03.978
5113de29-1965-4755-b5f4-f84b093ce9d3	ccf69344-92d2-485e-a489-5c50574c40e6	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	\N	2026-05-31 21:54:04.687
98d89a87-7291-4e4b-a7da-18e60902edbe	ccf69344-92d2-485e-a489-5c50574c40e6	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	\N	2026-05-31 21:55:05.236
9f6624d0-7409-436a-b1d3-3333afc41205	cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	\N	2026-05-31 21:55:07.267
b6a33900-96b5-4991-b1fb-4e9b72773388	\N	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	{"email": "wrong@fems.local", "reason": "user_not_found"}	2026-05-31 21:55:09.137
f85779fc-b4a6-44d7-9376-9c32a19feffc	\N	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	{"email": "alainkwishima@gmail.com", "reason": "user_not_found"}	2026-06-01 09:56:25.866
066b022b-a83d-4eb7-a055-7af94b984dcb	\N	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	{"email": "alainkwishima@gmail.com", "reason": "user_not_found"}	2026-06-01 09:56:27.483
aa411846-850c-4d57-8ee0-e61e4048d956	\N	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	{"email": "alainkwishima@gmail.com", "reason": "user_not_found"}	2026-06-01 09:57:27.917
f1b11bef-6110-42bf-9169-b319496f31a1	\N	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	{"email": "alainkwishima@gmail.com", "reason": "user_not_found"}	2026-06-01 09:57:29.337
d844b09c-be46-4668-8b9b-b295a511025a	edce6196-51f5-4883-a306-4791b672c7b1	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	{"reason": "invalid_password"}	2026-06-01 10:00:01.473
0df2a330-0586-49ed-ba4d-719e68b6c8a1	edce6196-51f5-4883-a306-4791b672c7b1	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	{"reason": "invalid_password"}	2026-06-01 10:00:10.348
dace67f0-0a1b-40b8-8904-119b19a3e6bf	edce6196-51f5-4883-a306-4791b672c7b1	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	{"reason": "invalid_password"}	2026-06-01 10:00:13.873
610ebbbe-6291-40a9-89ff-cb7d905b3b6f	cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	LOGIN	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	\N	2026-06-03 07:45:24.857
95360268-0403-4d25-b2da-51d3816e83bc	edce6196-51f5-4883-a306-4791b672c7b1	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"reason": "invalid_password"}	2026-06-03 07:47:21.885
0044238a-4a59-4c77-952d-c36713ece7b2	5397af05-e755-48bf-92fa-eb089f11105d	OTP_SENT	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 07:59:03.199
1a4b7388-a90e-42a4-a265-24095960b43f	5397af05-e755-48bf-92fa-eb089f11105d	SIGNUP	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"role": "User", "email": "jasoncoolaid@gmail.com"}	2026-06-03 07:59:03.208
96f59c6d-247a-4957-801e-ce3dde54c1b8	5397af05-e755-48bf-92fa-eb089f11105d	OTP_SENT	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 08:00:33.727
63258806-0c04-4d6a-9549-19c483ed9744	f2635f0d-fcb9-4c35-b28d-1410c102258f	OTP_SENT	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 08:01:39.462
7c18dada-383d-4d1f-afaf-7a2543f2c66e	f2635f0d-fcb9-4c35-b28d-1410c102258f	SIGNUP	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"role": "User", "email": "jacksoncoolaid@gmail.com"}	2026-06-03 08:01:39.47
8a2155b4-6012-40c8-b001-0a72f8388e23	f2635f0d-fcb9-4c35-b28d-1410c102258f	OTP_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 08:02:40.734
0fa3748d-c479-4db5-8f1a-8cd299476cd2	6dae2303-b680-438b-b957-3cb6d7c99ae3	OTP_SENT	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"purpose": "signup"}	2026-06-03 08:17:22.381
5265c50f-4d94-4475-a5b1-52349554fd47	6dae2303-b680-438b-b957-3cb6d7c99ae3	SIGNUP	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"role": "User", "email": "otp-test-083b9bfe@example.com"}	2026-06-03 08:17:22.387
7c7b3f29-a081-4b42-9889-cd3466dbfdec	772ccb10-869e-46fd-8955-d0b398f46988	OTP_SENT	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"purpose": "signup"}	2026-06-03 08:18:00.486
cd600e4f-b4e2-4ec6-af0d-7f47c56d0ed1	772ccb10-869e-46fd-8955-d0b398f46988	SIGNUP	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"role": "User", "email": "otp-test-653617962@gmail.com"}	2026-06-03 08:18:00.493
2c784b0c-1edb-43e1-9bc8-b365518fb156	cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	LOGIN	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	\N	2026-06-03 08:20:15.907
181c56f7-44f9-4ddd-9b49-be3c5eeb8ba8	9a17212c-5582-4177-bc8a-8a3679a0079f	OTP_SENT	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"purpose": "signup"}	2026-06-03 08:23:04.94
2778ee9a-769f-4b67-a348-3e20b5c65f36	9a17212c-5582-4177-bc8a-8a3679a0079f	SIGNUP	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"role": "User", "email": "pending-1348369486@example.com"}	2026-06-03 08:23:04.95
ea62c2cd-1293-436d-8707-3c50af96d67e	9a17212c-5582-4177-bc8a-8a3679a0079f	OTP_SENT	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"purpose": "signup"}	2026-06-03 08:23:05.349
c86fdab9-8d0f-4fbf-9a8e-ec613dd081ed	9a17212c-5582-4177-bc8a-8a3679a0079f	OTP_SENT	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457	{"purpose": "signup"}	2026-06-03 08:23:47.087
eacb5af0-dd5f-42f3-83f0-f2a9c7a0cc9f	730a89b1-6b62-46ce-8640-d04f1e75d079	OTP_SENT	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 08:24:58.214
f091d40c-7013-48e0-b774-dc596e0536aa	730a89b1-6b62-46ce-8640-d04f1e75d079	OTP_VERIFIED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 08:25:20.898
4e0b45f7-e80a-4db1-be13-4c62b508047c	730a89b1-6b62-46ce-8640-d04f1e75d079	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 08:25:31.606
6f0c1e92-ad88-4891-86cc-2d8c287bb351	730a89b1-6b62-46ce-8640-d04f1e75d079	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 08:28:29.584
d6501599-9a67-4501-a9a6-272e4e20b847	730a89b1-6b62-46ce-8640-d04f1e75d079	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 09:28:13.139
e48d43c0-c94e-416a-bb89-b389c1673144	cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	LOGIN_FAILED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"reason": "invalid_password"}	2026-06-03 09:28:40.287
5eeff44c-f38f-49c8-bd7c-720a9590fe64	f2635f0d-fcb9-4c35-b28d-1410c102258f	OTP_SENT	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 09:29:51.579
d28c71a6-98a1-4d38-95e8-79220a7a7773	f2635f0d-fcb9-4c35-b28d-1410c102258f	OTP_VERIFIED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 09:30:31.094
407b55b1-49ba-4fd7-a5fa-59084967f091	f2635f0d-fcb9-4c35-b28d-1410c102258f	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 09:30:38.026
d56cfcc6-9b7b-4dab-bc38-97f1e7ef07d2	967b8ddb-5116-425f-ba5e-46c79aa07909	OTP_SENT	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 09:37:21.442
a9e600f3-c985-4a98-8ee2-4d98b6297577	967b8ddb-5116-425f-ba5e-46c79aa07909	OTP_VERIFIED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 09:37:43.658
07d8260e-fdea-495a-baf7-e724ee7fd667	967b8ddb-5116-425f-ba5e-46c79aa07909	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 09:38:15.188
f80dc52e-cda0-409b-8b90-4e37525f3c83	f2635f0d-fcb9-4c35-b28d-1410c102258f	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 09:40:00.234
94407ec2-ab59-45aa-aaf8-e6df7bd8564e	40ff09c7-d930-499a-9b4a-51fdbbcb815d	OTP_SENT	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 09:45:39.597
3f219250-2f26-4ef2-a598-cdd86dc4d309	40ff09c7-d930-499a-9b4a-51fdbbcb815d	OTP_VERIFIED	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"purpose": "signup"}	2026-06-03 09:46:16.608
85721599-72a1-4684-9aeb-ee2331f80636	40ff09c7-d930-499a-9b4a-51fdbbcb815d	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 09:46:18.593
e6398e03-0a49-41cd-9feb-91cf41ae71ee	f2635f0d-fcb9-4c35-b28d-1410c102258f	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 09:51:14.128
4b13a584-8dde-433a-8b6f-f288369fe810	f2635f0d-fcb9-4c35-b28d-1410c102258f	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 10:08:34.884
11cb54bb-dd85-40c9-89f6-aee2fd9928f8	40ff09c7-d930-499a-9b4a-51fdbbcb815d	LOGIN	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	2026-06-03 11:31:54.213
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otps (id, user_id, destination, code_hash, purpose, expires_at, verified_at, attempts, created_at) FROM stdin;
cc659bd5-e970-440c-bdf3-26f62d2ceb03	edce6196-51f5-4883-a306-4791b672c7b1	alainkwishima@gmail.com	9c7c1e85266f0f8937791d5a743dd7a39ff9b477f3e5056e49c471132c6607d8	signup	2026-06-01 10:09:11.309	\N	0	2026-06-01 09:59:11.323
2856e8f8-0d73-43ef-8455-41add9330345	5397af05-e755-48bf-92fa-eb089f11105d	jasoncoolaid@gmail.com	4adfe8db2cc4efb98786befe1c391d2c4160d2168e957b86da68b6d529a4a10e	signup	2026-06-03 08:09:02.271	\N	0	2026-06-03 07:59:02.273
86c1ed8b-b318-4188-a714-a8bc93ddd543	5397af05-e755-48bf-92fa-eb089f11105d	jasoncoolaid@gmail.com	1f8a81f542791a01e11f462e5381d911566982e2d4b5382a25691d1ab86664ba	signup	2026-06-03 08:10:32.918	\N	0	2026-06-03 08:00:32.919
cc7a312f-d4e0-4274-984e-cc70d104b7af	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	c26b0150aa03f5cefe4ed87a684baa1cc54c66c2ebb1b899f7fad60b78ca78d5	signup	2026-06-03 08:11:37.89	\N	1	2026-06-03 08:01:37.891
ae0946e7-e771-4cac-982c-322420f328e0	730a89b1-6b62-46ce-8640-d04f1e75d079	kaealain26@gmail.com	90f292b47aedd0fe26979aeea4d2b9c32824a7721e24bcb9af6d0ff29e481ee7	signup	2026-06-03 08:16:19.422	\N	0	2026-06-03 08:06:19.424
5fc4410c-9b01-4975-bb02-97a84e831e3d	6dae2303-b680-438b-b957-3cb6d7c99ae3	otp-test-083b9bfe@example.com	c865d012323cb9c18074981581dad9517d447e0cb91c4b757ec7b1958e57ca04	signup	2026-06-03 08:27:16.355	\N	0	2026-06-03 08:17:16.357
4d9472f8-bf90-41e4-b074-cf871fdd1aa5	772ccb10-869e-46fd-8955-d0b398f46988	otp-test-653617962@gmail.com	86d244595e4c31de640010a9ec2c4c6fb198c510cd46f794741b043097ffc4e9	signup	2026-06-03 08:27:59.174	\N	0	2026-06-03 08:17:59.175
b29eb18a-a44a-4ead-a308-9eb2f17ae680	9a17212c-5582-4177-bc8a-8a3679a0079f	pending-1348369486@example.com	abda1c4803f2b97da899b09a15e1cb4cb744b1f9bb9b68e85b01cfeff79efdf7	signup	2026-06-03 08:33:03.292	\N	0	2026-06-03 08:23:03.294
e5b637cd-baf0-4637-8f9d-e2a03b81245a	9a17212c-5582-4177-bc8a-8a3679a0079f	pending-1348369486@example.com	e7eeee6636d48c682f26b7ad0074ea7e5023b7e8803da4b45f275190d94763ea	signup	2026-06-03 08:33:05.066	\N	0	2026-06-03 08:23:05.068
75e2299e-1fed-4cfb-b0c3-63b3cc80b23e	9a17212c-5582-4177-bc8a-8a3679a0079f	pending-1348369486@example.com	57a3dc17f36e50ce66c93279d00acc57ca20c74ee4922c5242b57fddbaed11af	signup	2026-06-03 08:33:44.128	\N	0	2026-06-03 08:23:44.133
0fbd009d-6aec-4dbe-880f-d3cf9485fcf0	730a89b1-6b62-46ce-8640-d04f1e75d079	kaealain26@gmail.com	26b0d68e35c65058da3bd9fc0c0703e66a8390e1e0bf1db4a63946fbf44dcb49	signup	2026-06-03 08:34:57.395	2026-06-03 08:25:20.883	0	2026-06-03 08:24:57.398
88a7f354-4748-4714-a471-3dcbe26c6210	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	30ca6d0518acf2f00885f745a6ff160ffdf6e9391b53d2c3cc4d982728615a17	signup	2026-06-03 09:39:49.985	2026-06-03 09:30:31.083	0	2026-06-03 09:29:49.987
6845f1c7-49be-42f1-9345-5c3520106ba0	967b8ddb-5116-425f-ba5e-46c79aa07909	thepeakyblinda@gmail.com	f7115fa22d10576f800a163e70b34132ab6243ad47d1a894077da189ff79ed41	signup	2026-06-03 09:47:12.641	\N	0	2026-06-03 09:37:12.642
db411422-7084-40a3-92a3-8031325b17a8	967b8ddb-5116-425f-ba5e-46c79aa07909	thepeakyblinda@gmail.com	8a7da71fdca9ed85929527252cc79ac7d5edaa5c7fa81b6e18a8b33f8bcf1a0c	signup	2026-06-03 09:47:20.523	2026-06-03 09:37:43.647	0	2026-06-03 09:37:20.524
d43be65b-3e47-4ecb-b134-e87ba4b25e82	40ff09c7-d930-499a-9b4a-51fdbbcb815d	moonreaper99@gmail.com	a32d5a7a36830eab04c214ec17ab737432ec3161e02236abd26b2ebba727ff8e	signup	2026-06-03 09:55:35.079	\N	0	2026-06-03 09:45:35.08
898d7fbb-a2dd-49f3-91cf-4a2369913d1e	40ff09c7-d930-499a-9b4a-51fdbbcb815d	moonreaper99@gmail.com	f45e99c0662f0bc73454f01baba44d825a886bef09d86bb55de2d52e44411959	signup	2026-06-03 09:55:38.739	2026-06-03 09:46:16.574	0	2026-06-03 09:45:38.74
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at) FROM stdin;
d9823b96-8db3-4e10-b58b-dfedfdd9551e	edce6196-51f5-4883-a306-4791b672c7b1	55825fdcfe05355ed99b7787c7f23e7083c6dbfd2cca40159c6ab0dbbfad2549	2026-06-01 11:00:33.982	\N	2026-06-01 10:00:33.989
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, created_at, updated_at) FROM stdin;
982be25c-e6d9-4a0e-a698-159cba014ddd	Admin	System administrator with full access	2026-05-31 21:35:56.107	2026-06-03 11:20:33.751
165297cb-a0b1-4f5d-82dc-acc3cfab5e16	Inspector	Field inspector for service requests and assets	2026-05-31 21:35:56.131	2026-06-03 11:20:33.883
b8ae9586-36c8-486b-addc-f3cf673a1cd4	User	Portal user for assets and service requests	2026-05-31 21:35:56.135	2026-06-03 11:20:33.89
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, assigned_at) FROM stdin;
cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	982be25c-e6d9-4a0e-a698-159cba014ddd	2026-05-31 21:35:56.145
1e928f00-8a58-471e-a72c-ca780c43ac16	165297cb-a0b1-4f5d-82dc-acc3cfab5e16	2026-05-31 21:35:56.175
ccf69344-92d2-485e-a489-5c50574c40e6	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-05-31 21:35:56.186
edce6196-51f5-4883-a306-4791b672c7b1	982be25c-e6d9-4a0e-a698-159cba014ddd	2026-06-01 09:59:11.304
6c4dbe3b-d9b0-4bc3-939c-2daa3b15427f	982be25c-e6d9-4a0e-a698-159cba014ddd	2026-05-31 21:35:56.161
5db350dc-6dec-4e62-bdcf-b45224669dec	165297cb-a0b1-4f5d-82dc-acc3cfab5e16	2026-06-03 07:44:18.916
cece529d-43d4-4fab-a1a2-13725ea82017	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-06-03 07:44:18.942
5397af05-e755-48bf-92fa-eb089f11105d	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-06-03 07:59:02.23
f2635f0d-fcb9-4c35-b28d-1410c102258f	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-06-03 08:01:37.87
730a89b1-6b62-46ce-8640-d04f1e75d079	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-06-03 08:06:19.405
6dae2303-b680-438b-b957-3cb6d7c99ae3	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-06-03 08:17:16.321
772ccb10-869e-46fd-8955-d0b398f46988	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-06-03 08:17:59.156
9a17212c-5582-4177-bc8a-8a3679a0079f	b8ae9586-36c8-486b-addc-f3cf673a1cd4	2026-06-03 08:23:03.26
967b8ddb-5116-425f-ba5e-46c79aa07909	165297cb-a0b1-4f5d-82dc-acc3cfab5e16	2026-06-03 09:37:12.587
40ff09c7-d930-499a-9b4a-51fdbbcb815d	982be25c-e6d9-4a0e-a698-159cba014ddd	2026-06-03 09:45:35.044
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, phone_number, is_email_verified, is_active, customer_id, last_login_at, created_at, updated_at, google_id, first_name, last_name) FROM stdin;
edce6196-51f5-4883-a306-4791b672c7b1	alainkwishima@gmail.com	$2a$12$1WSFzM8unsr6EFED1m9mje.roJFYXJKoSdrJE04bsLHzXKNlUHUbu	\N	f	t	\N	\N	2026-06-01 09:59:11.304	2026-06-01 09:59:11.304	\N	alainkwishima	User
cb5e7b96-7e72-4b2d-a0e1-73316f42b62e	admin@fems.local	$2a$12$t9K6aKPPxF9Imbh3NFsCVeN0uvLiahR0ZBLEcmqfh4fezgGKIMuAW	+254700000001	t	t	\N	2026-06-03 08:20:15.875	2026-05-31 21:35:56.139	2026-06-03 11:20:33.898	\N	System	Administrator
5db350dc-6dec-4e62-bdcf-b45224669dec	inspector@fems.local	$2a$12$t9K6aKPPxF9Imbh3NFsCVeN0uvLiahR0ZBLEcmqfh4fezgGKIMuAW	+254700000003	t	t	\N	\N	2026-06-03 07:44:18.906	2026-06-03 11:20:34.048	\N	Field	Inspector
40ff09c7-d930-499a-9b4a-51fdbbcb815d	moonreaper99@gmail.com	$2a$12$EWHZ0KSWgCDrqzUvUWPq7e6cLMiiIkExetN7MD0VQ410r/u9W5gxW	\N	t	t	\N	2026-06-03 11:31:54.199	2026-06-03 09:45:35.044	2026-06-03 11:31:54.202	\N	Moon	Teta
967b8ddb-5116-425f-ba5e-46c79aa07909	thepeakyblinda@gmail.com	$2a$12$Q7yllSHHKbp4JKXsPOLJ2.kVH/jGm0GkOeXEVsyFTPpfOi4l.F5R6	\N	t	t	\N	2026-06-03 09:38:15.171	2026-06-03 09:37:12.587	2026-06-03 09:38:15.172	\N	John	Kagabo
6c4dbe3b-d9b0-4bc3-939c-2daa3b15427f	staff@fems.local	$2a$12$I5SA71Jj33SOtl9ngdGqc.AlDsfIIpjC036lRB3.9SzBLEyMZ/QIC	+254700000002	t	t	\N	2026-05-31 21:53:02.224	2026-05-31 21:35:56.158	2026-05-31 21:53:02.224	\N	Office	Staff
1e928f00-8a58-471e-a72c-ca780c43ac16	tech@fems.local	$2a$12$I5SA71Jj33SOtl9ngdGqc.AlDsfIIpjC036lRB3.9SzBLEyMZ/QIC	+254700000003	t	t	\N	2026-05-31 21:53:03.933	2026-05-31 21:35:56.171	2026-05-31 21:53:03.934	\N	Field	Technician
ccf69344-92d2-485e-a489-5c50574c40e6	customer@fems.local	$2a$12$I5SA71Jj33SOtl9ngdGqc.AlDsfIIpjC036lRB3.9SzBLEyMZ/QIC	+254700000004	t	t	00000000-0000-4000-8000-000000000001	2026-05-31 21:55:05.209	2026-05-31 21:35:56.183	2026-05-31 21:55:05.21	\N	Demo	Customer
5397af05-e755-48bf-92fa-eb089f11105d	jasoncoolaid@gmail.com	$2a$12$MxPfbrKYtsecpDlcGD/0XOi3377hDTWRt2lgV832eF.NuvE68cpl.	+250782171969	f	t	\N	\N	2026-06-03 07:59:02.23	2026-06-03 07:59:02.23	\N	Alain	Kae
6dae2303-b680-438b-b957-3cb6d7c99ae3	otp-test-083b9bfe@example.com	$2a$12$d9xF65TAIy2h.PkY4.skHuBxE87xPLWjbwdSEfx2BzAOBJlc5/beG	\N	f	t	\N	\N	2026-06-03 08:17:16.321	2026-06-03 08:17:16.321	\N	OTP	Test User
772ccb10-869e-46fd-8955-d0b398f46988	otp-test-653617962@gmail.com	$2a$12$dshdyY65djp8oCYPtYOOHOt51EHb5KSHWBVITTvluDtsmc1R/o9EO	\N	f	t	\N	\N	2026-06-03 08:17:59.156	2026-06-03 08:17:59.156	\N	OTP	Test User
9a17212c-5582-4177-bc8a-8a3679a0079f	pending-1348369486@example.com	$2a$12$3ToaMZON0P9Qfyr7MRsdN.rVwtXvwTBVCndak/gksHZubiv/UV5dO	\N	f	t	\N	\N	2026-06-03 08:23:03.26	2026-06-03 08:23:03.26	\N	Pending	User
730a89b1-6b62-46ce-8640-d04f1e75d079	kaealain26@gmail.com	$2a$12$wAhvyQXggWNNc6VP1TW8z.0kOp1EfqZ7uWpgZVZRfl35KoMo7NY/y	+250782171969	t	t	5ca8914c-8ae2-473f-a5fc-474be981a2d2	2026-06-03 09:28:13.114	2026-06-03 08:06:19.405	2026-06-03 09:28:13.116	\N	Alain	Kae
f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	$2a$12$6UbLnRt/UB4G.S2qxhW/deedzVKc8TYasOAGyNJO8NoCY.L1p/mpW	+250782171969	t	t	f2635f0d-fcb9-4c35-b28d-1410c102258f	2026-06-03 10:08:34.831	2026-06-03 08:01:37.87	2026-06-03 10:08:34.836	\N	Alain	Kae
cece529d-43d4-4fab-a1a2-13725ea82017	user@fems.local	$2a$12$t9K6aKPPxF9Imbh3NFsCVeN0uvLiahR0ZBLEcmqfh4fezgGKIMuAW	+254700000004	t	t	cece529d-43d4-4fab-a1a2-13725ea82017	\N	2026-06-03 07:44:18.935	2026-06-03 11:20:34.199	\N	Demo	User
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: auth_audit_logs auth_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: auth_audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_audit_logs_action_idx ON public.auth_audit_logs USING btree (action);


--
-- Name: auth_audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_audit_logs_created_at_idx ON public.auth_audit_logs USING btree (created_at);


--
-- Name: auth_audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_audit_logs_user_id_idx ON public.auth_audit_logs USING btree (user_id);


--
-- Name: otps_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otps_expires_at_idx ON public.otps USING btree (expires_at);


--
-- Name: otps_user_id_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otps_user_id_purpose_idx ON public.otps USING btree (user_id, purpose);


--
-- Name: password_reset_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_reset_tokens_token_hash_key ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: password_reset_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_user_id_idx ON public.password_reset_tokens USING btree (user_id);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: users_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_customer_id_idx ON public.users USING btree (customer_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_google_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_google_id_key ON public.users USING btree (google_id);


--
-- Name: auth_audit_logs auth_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: otps otps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict hlNFapb9eKWEBJ0XFXS2t8E5ajbtgzzFEUFETf7GBxxqIJyyahQqBixZuSDPIcF

