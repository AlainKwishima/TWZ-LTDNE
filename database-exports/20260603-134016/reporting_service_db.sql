--
-- PostgreSQL database dump
--

\restrict VhylRo0F1l2U9ajt9t3Z5mClX7zmUgmBI8gzoLgcKeoNEph39W8i6CVaCFQei0Y

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
-- Name: ExportFormat; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExportFormat" AS ENUM (
    'pdf',
    'csv',
    'xlsx'
);


--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'pending',
    'completed',
    'failed'
);


--
-- Name: ReportType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportType" AS ENUM (
    'sales',
    'customers',
    'inventory',
    'low_stock',
    'expired_assets',
    'expiring_soon',
    'service_requests',
    'notifications',
    'invoices',
    'escalations',
    'asset_inventory'
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
-- Name: generated_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_reports (
    id text NOT NULL,
    "reportType" public."ReportType" NOT NULL,
    title text NOT NULL,
    status public."ReportStatus" DEFAULT 'pending'::public."ReportStatus" NOT NULL,
    "rowCount" integer DEFAULT 0 NOT NULL,
    summary jsonb,
    "dataSnapshot" jsonb,
    "generatedBy" text,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: report_exports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_exports (
    id text NOT NULL,
    "generatedReportId" text NOT NULL,
    format public."ExportFormat" NOT NULL,
    "filePath" text NOT NULL,
    "fileName" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: report_filters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_filters (
    id text NOT NULL,
    "generatedReportId" text NOT NULL,
    "dateFrom" timestamp(3) without time zone,
    "dateTo" timestamp(3) without time zone,
    "customerId" text,
    "productType" text,
    status text,
    "technicianId" text,
    "paymentStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
13e29923-eabe-4b45-9182-ef8c0bc27b70	6a839b5ad02087c17af63bef0fbdd4aeafdf8f74f17cc2354fb842e3be1920af	2026-05-31 21:35:41.678819+00	20250530000000_init	\N	\N	2026-05-31 21:35:41.607552+00	1
b4874644-dc8f-42ab-807a-1a971c70badd	e29320ac90e9b2d6a5f9d1f26ecfc9116abb0bd89e601eb220d069244948f565	2026-06-03 11:36:51.022481+00	20260604000000_add_asset_inventory_report	\N	\N	2026-06-03 11:36:50.799012+00	1
\.


--
-- Data for Name: generated_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.generated_reports (id, "reportType", title, status, "rowCount", summary, "dataSnapshot", "generatedBy", "errorMessage", "createdAt", "updatedAt") FROM stdin;
22d41496-365d-4e4b-8530-c63f0740e3d9	sales	Sample Sales Report ΓÇô May 2025	completed	3	{"orderCount": 3, "totalRevenue": 262000, "averageOrderValue": 87333.33}	{"rows": [{"id": "ORD-001", "date": "2025-05-01", "amount": 45000, "status": "completed", "customer": "James Mwangi"}, {"id": "ORD-002", "date": "2025-05-10", "amount": 128000, "status": "completed", "customer": "Safari Hotels Ltd"}, {"id": "ORD-003", "date": "2025-05-15", "amount": 89000, "status": "pending", "customer": "Nairobi General Hospital"}], "columns": ["id", "customer", "amount", "status", "date"]}	system	\N	2026-05-31 21:36:01.863	2026-05-31 21:36:01.863
61edba47-f732-4dc2-a833-55aec2f2e983	service_requests	Service Requests Report ΓÇô 2026-06-03	completed	0	{"requestCount": 0}	{"rows": [], "columns": ["id", "serviceType", "status", "priority", "technicianId", "createdAt"]}	40ff09c7-d930-499a-9b4a-51fdbbcb815d	\N	2026-06-03 10:40:45.132	2026-06-03 10:40:45.281
39539bd9-42c2-4586-a51b-9754654b9146	expired_assets	Expired Assets Report ΓÇô 2026-06-03	completed	0	{"assetCount": 0}	{"rows": [], "columns": ["serialNumber", "type", "size", "status", "installationDate", "expirationDate", "location"]}	40ff09c7-d930-499a-9b4a-51fdbbcb815d	\N	2026-06-03 10:41:45.939	2026-06-03 10:41:45.98
5daea24d-b474-4bca-8f1b-ebb54f531c4e	notifications	Notifications Report ΓÇô 2026-06-03	completed	14	{"notificationCount": 14}	{"rows": [{"id": "4c61ec46-f1f0-4121-a826-24b6b0e24810", "status": "Sent", "channel": "InApp", "subject": "Maintenance completed", "createdAt": "2026-06-03T11:04:27.148Z", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}, {"id": "9982bf75-66e8-40de-8252-36dd8db981fa", "status": "Sent", "channel": "Email", "subject": "Maintenance completed ΓÇö {{requestNumber}}", "createdAt": "2026-06-03T11:04:26.288Z", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}, {"id": "d3cbe8f5-1c0b-44d3-afcf-60f4ad705521", "status": "Sent", "channel": "InApp", "subject": "Request SR-20260603-2619 updated", "createdAt": "2026-06-03T11:04:12.940Z"}, {"id": "bdf57fb6-6f52-4ca6-a658-6b6cee4ab2ec", "status": "Sent", "channel": "InApp", "subject": "Request SR-20260603-2619 updated", "createdAt": "2026-06-03T11:04:12.895Z", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}, {"id": "3e23eede-912b-4bd7-a36f-6cf6d126098c", "status": "Sent", "channel": "InApp", "subject": "Maintenance request received", "createdAt": "2026-06-03T11:02:51.920Z", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}, {"id": "139c99a0-cd64-4130-bcc9-44f86266f531", "status": "Failed", "channel": "Email", "subject": "Maintenance request SR-20260603-2619 received", "createdAt": "2026-06-03T11:02:51.756Z", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}, {"id": "05f42ec6-5603-425a-aeaf-ed1522e37078", "status": "Sent", "channel": "InApp", "subject": "Extinguisher SN-20250601-10002 ΓÇö 29 day(s) until expiry", "createdAt": "2026-06-03T10:55:26.169Z", "customerId": "cece529d-43d4-4fab-a1a2-13725ea82017"}, {"id": "487a5c55-7a4f-4cbe-89a5-29c18d82258e", "status": "Sent", "channel": "Email", "subject": "Extinguisher SN-20250601-10002 ΓÇö 29 day(s) until expiry", "createdAt": "2026-06-03T10:55:25.229Z", "customerId": "cece529d-43d4-4fab-a1a2-13725ea82017"}, {"id": "afde7922-fbaa-4a01-866c-f6d5e01ab6f1", "status": "Sent", "channel": "InApp", "subject": "New extinguisher registered", "createdAt": "2026-06-03T10:37:06.621Z", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}, {"id": "685b395a-2a4f-4eb9-94fc-de575980d554", "status": "Sent", "channel": "InApp", "subject": "New extinguisher registered", "createdAt": "2026-06-03T10:37:06.613Z", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}, {"id": "bf2702b8-af14-4f6f-bb04-6532b60d880b", "status": "Sent", "channel": "InApp", "subject": "Extinguisher FE-10002 ΓÇö 29 day(s) until expiry", "createdAt": "2026-06-03T07:45:15.000Z", "customerId": "11111111-1111-1111-1111-111111111111"}, {"id": "d51e6a25-8bc7-4759-a853-786f958310d4", "status": "Failed", "channel": "Email", "subject": "Extinguisher FE-10002 ΓÇö 29 day(s) until expiry", "createdAt": "2026-06-03T07:45:14.883Z", "customerId": "11111111-1111-1111-1111-111111111111"}, {"id": "bc667337-ce7f-4237-8ca1-1f97b339b0b3", "status": "Sent", "channel": "InApp", "subject": "Extinguisher FE-10001 ΓÇö 23 day(s) until expiry", "createdAt": "2026-06-03T07:45:14.789Z", "customerId": "00000000-0000-4000-8000-000000000001"}, {"id": "092c9f7e-0286-4960-abee-16e417f00f59", "status": "Sent", "channel": "Email", "subject": "Extinguisher FE-10001 ΓÇö 23 day(s) until expiry", "createdAt": "2026-06-03T07:45:14.271Z", "customerId": "00000000-0000-4000-8000-000000000001"}], "columns": ["id", "channel", "status", "subject", "createdAt"]}	40ff09c7-d930-499a-9b4a-51fdbbcb815d	\N	2026-06-03 11:14:20.335	2026-06-03 11:14:20.654
\.


--
-- Data for Name: report_exports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_exports (id, "generatedReportId", format, "filePath", "fileName", "fileSize", "mimeType", "createdAt") FROM stdin;
e4bf2c4a-5559-40c7-8014-0850a91006a4	61edba47-f732-4dc2-a833-55aec2f2e983	pdf	C:\\Users\\myves\\Documents\\NE_Templates\\FEMS\\services\\reporting-service\\exports\\service-requests-report-2026-06-03-61edba47.pdf	service-requests-report-2026-06-03-61edba47.pdf	1710	application/pdf	2026-06-03 10:40:50.748
9339a124-e9db-4474-8cb7-c8a1b49be6ff	39539bd9-42c2-4586-a51b-9754654b9146	pdf	C:\\Users\\myves\\Documents\\NE_Templates\\FEMS\\services\\reporting-service\\exports\\expired-assets-report-2026-06-03-39539bd9.pdf	expired-assets-report-2026-06-03-39539bd9.pdf	1740	application/pdf	2026-06-03 10:41:50.713
bc60ec41-204b-4c31-af21-2cc9d8d86cfa	5daea24d-b474-4bca-8f1b-ebb54f531c4e	pdf	C:\\Users\\myves\\Documents\\NE_Templates\\FEMS\\services\\reporting-service\\exports\\notifications-report-2026-06-03-5daea24d.pdf	notifications-report-2026-06-03-5daea24d.pdf	3015	application/pdf	2026-06-03 11:14:27.032
\.


--
-- Data for Name: report_filters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_filters (id, "generatedReportId", "dateFrom", "dateTo", "customerId", "productType", status, "technicianId", "paymentStatus", "createdAt") FROM stdin;
9b08ca9e-e2bf-4019-b887-b0f99e92aa50	22d41496-365d-4e4b-8530-c63f0740e3d9	2025-05-01 00:00:00	2025-05-31 00:00:00	\N	\N	\N	\N	\N	2026-05-31 21:36:01.863
43ecdf0c-85ec-42f6-b1e8-35a64ece9410	61edba47-f732-4dc2-a833-55aec2f2e983	2026-06-05 00:00:00	2026-06-24 00:00:00	\N	\N	\N	\N	\N	2026-06-03 10:40:45.132
cabfbcf7-9b49-4a7e-821f-d77dc9b0bea5	39539bd9-42c2-4586-a51b-9754654b9146	2026-06-03 00:00:00	2026-06-16 00:00:00	\N	\N	\N	\N	\N	2026-06-03 10:41:45.939
f700b9d0-d7ee-4b08-9425-538183449427	5daea24d-b474-4bca-8f1b-ebb54f531c4e	2026-06-03 00:00:00	2026-06-08 00:00:00	\N	\N	\N	\N	\N	2026-06-03 11:14:20.335
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: generated_reports generated_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_reports
    ADD CONSTRAINT generated_reports_pkey PRIMARY KEY (id);


--
-- Name: report_exports report_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_pkey PRIMARY KEY (id);


--
-- Name: report_filters report_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_filters
    ADD CONSTRAINT report_filters_pkey PRIMARY KEY (id);


--
-- Name: generated_reports_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "generated_reports_createdAt_idx" ON public.generated_reports USING btree ("createdAt");


--
-- Name: generated_reports_reportType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "generated_reports_reportType_idx" ON public.generated_reports USING btree ("reportType");


--
-- Name: generated_reports_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX generated_reports_status_idx ON public.generated_reports USING btree (status);


--
-- Name: report_exports_format_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX report_exports_format_idx ON public.report_exports USING btree (format);


--
-- Name: report_exports_generatedReportId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "report_exports_generatedReportId_idx" ON public.report_exports USING btree ("generatedReportId");


--
-- Name: report_filters_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "report_filters_customerId_idx" ON public.report_filters USING btree ("customerId");


--
-- Name: report_filters_generatedReportId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "report_filters_generatedReportId_key" ON public.report_filters USING btree ("generatedReportId");


--
-- Name: report_filters_productType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "report_filters_productType_idx" ON public.report_filters USING btree ("productType");


--
-- Name: report_filters_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX report_filters_status_idx ON public.report_filters USING btree (status);


--
-- Name: report_exports report_exports_generatedReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT "report_exports_generatedReportId_fkey" FOREIGN KEY ("generatedReportId") REFERENCES public.generated_reports(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: report_filters report_filters_generatedReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_filters
    ADD CONSTRAINT "report_filters_generatedReportId_fkey" FOREIGN KEY ("generatedReportId") REFERENCES public.generated_reports(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict VhylRo0F1l2U9ajt9t3Z5mClX7zmUgmBI8gzoLgcKeoNEph39W8i6CVaCFQei0Y

