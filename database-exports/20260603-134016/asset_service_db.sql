--
-- PostgreSQL database dump
--

\restrict tnb3rDKgEXwVjaMuR1o7ucimRf1oJre1erTu9M7zdYix6Xre0yL1F0Z49AwDase

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
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'Active',
    'ExpiringSoon',
    'Expired',
    'Serviced',
    'NeedsReplacement',
    'HighRisk'
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
-- Name: asset_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_histories (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "eventType" text NOT NULL,
    description text NOT NULL,
    "oldStatus" public."AssetStatus",
    "newStatus" public."AssetStatus",
    metadata jsonb,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: asset_service_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_service_records (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "serviceType" text NOT NULL,
    "serviceDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "technicianId" text,
    "technicianName" text,
    notes text,
    "nextServiceDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: fire_extinguisher_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fire_extinguisher_assets (
    id text NOT NULL,
    "assetCode" text NOT NULL,
    "customerId" text NOT NULL,
    "serialNumber" text NOT NULL,
    "serviceDate" timestamp(3) without time zone,
    "nextServiceDate" timestamp(3) without time zone,
    "expirationDate" timestamp(3) without time zone NOT NULL,
    status public."AssetStatus" DEFAULT 'Active'::public."AssetStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "refillBookedAt" timestamp(3) without time zone,
    type text NOT NULL,
    size text NOT NULL,
    location text,
    "installationDate" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5cbda281-9c22-4eb7-989c-cd199e8b3e3d	37691db0274ba3b6cfaa4472d9e1693f6fe8d7b51fae8ce4a0bffc14e120a9f2	2026-05-31 21:35:29.791834+00	20250530120000_init	\N	\N	2026-05-31 21:35:29.684395+00	1
0109f3e6-ef8a-46f6-be51-44fbe932a415	b10addbdcf6991f5b89b0d480abbe3f658e52bbdc3290f69cb51879967778e52	2026-05-31 21:35:29.806488+00	20260530120000_add_refill_booked	\N	\N	2026-05-31 21:35:29.795511+00	1
0dba04c1-18de-47b1-8455-83aa99ce3519	565f260b69326cfc5cfa91d04affdb4a23f7f34fc46523e1a071c99f14252ccc	2026-06-03 10:36:21.647798+00	20260601000000_standardize_asset_model	\N	\N	2026-06-03 10:36:21.483647+00	1
\.


--
-- Data for Name: asset_histories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_histories (id, "assetId", "eventType", description, "oldStatus", "newStatus", metadata, "createdBy", "createdAt") FROM stdin;
242a5603-91c6-4549-8848-b1508c088341	fefd5ace-204c-4f0c-b8a8-2e9757c6c3e4	REGISTERED	Asset manually registered during seed	\N	Active	\N	\N	2026-05-31 21:35:54.254
786c25b4-d853-47af-aac9-1fda2f0d8fa5	f2394ee9-6505-40df-879a-4007ed0f8759	STATUS_CHANGE	Marked as expiring soon	Active	ExpiringSoon	\N	\N	2026-05-31 21:35:54.285
de26ef60-7475-4878-8fbe-a5dd20624853	fa774722-5a86-43c4-ba5a-9247fc4dfc6d	SEED	Demo extinguisher registered via seed	\N	Active	\N	\N	2026-06-03 10:36:25.26
be168f78-0e74-4b83-b5ee-8bfe21a4ff66	9a351d32-347b-49ee-a4c0-d80ebe31ac61	MANUAL_REGISTRATION	Fire extinguisher registered	\N	Active	\N	40ff09c7-d930-499a-9b4a-51fdbbcb815d	2026-06-03 10:37:05.995
1431b601-afe7-463e-8389-376ec1d585b3	9a351d32-347b-49ee-a4c0-d80ebe31ac61	SERVICE_RECORD	Refill service recorded	Active	Serviced	{"serviceType": "Refill"}	967b8ddb-5116-425f-ba5e-46c79aa07909	2026-06-03 11:04:26.197
\.


--
-- Data for Name: asset_service_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_service_records (id, "assetId", "serviceType", "serviceDate", "technicianId", "technicianName", notes, "nextServiceDate", "createdAt", "updatedAt") FROM stdin;
195e5487-def9-4751-b03a-54f3aa667a23	fefd5ace-204c-4f0c-b8a8-2e9757c6c3e4	Initial Inspection	2025-05-28 00:00:00	\N	Demo Technician	Passed initial inspection	2026-05-28 00:00:00	2026-05-31 21:35:54.254	2026-05-31 21:35:54.254
1a667323-9f2a-4869-970c-3c76f96de71e	9a351d32-347b-49ee-a4c0-d80ebe31ac61	Refill	2026-06-03 11:04:25.991	967b8ddb-5116-425f-ba5e-46c79aa07909	thepeakyblinda@gmail.com	wggtw ΓÇö wgtgrt	2027-06-03 11:04:25.991	2026-06-03 11:04:26.197	2026-06-03 11:04:26.197
\.


--
-- Data for Name: fire_extinguisher_assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fire_extinguisher_assets (id, "assetCode", "customerId", "serialNumber", "serviceDate", "nextServiceDate", "expirationDate", status, notes, "createdAt", "updatedAt", "refillBookedAt", type, size, location, "installationDate") FROM stdin;
f2394ee9-6505-40df-879a-4007ed0f8759	FE-10002	cece529d-43d4-4fab-a1a2-13725ea82017	SN-CO2-2024-002	\N	\N	2026-07-01 21:35:54.281	ExpiringSoon	\N	2026-05-31 21:35:54.285	2026-06-03 10:05:27.134	\N	CO2 Fire Extinguisher 5kg	prod-co2-5kg	Server room	2021-07-01 21:35:54.281
fefd5ace-204c-4f0c-b8a8-2e9757c6c3e4	FE-10001	cece529d-43d4-4fab-a1a2-13725ea82017	SN-DP6-2025-001	2025-05-28 00:00:00	2026-05-28 00:00:00	2030-05-28 00:00:00	Active	Demo asset from seed data	2026-05-31 21:35:54.254	2026-06-03 10:05:27.176	\N	Dry Powder 6kg ABC	prod-dry-powder-6kg	Ground floor lobby	2025-05-28 00:00:00
fa774722-5a86-43c4-ba5a-9247fc4dfc6d	SN-20250528-10001	cece529d-43d4-4fab-a1a2-13725ea82017	SN-20250528-10001	2025-05-28 12:00:00	\N	2030-05-28 12:00:00	Active	Demo asset from seed data	2026-06-03 10:36:25.26	2026-06-03 10:36:25.26	\N	Dry Powder ABC	6kg	Ground floor lobby	2025-05-28 12:00:00
09e2cfec-46b6-4afe-9e90-20d474f5a3ff	SN-20250601-10002	cece529d-43d4-4fab-a1a2-13725ea82017	SN-20250601-10002	2025-06-01 12:00:00	\N	2026-07-01 12:00:00	ExpiringSoon	Demo CO2 unit	2026-06-03 10:36:25.36	2026-06-03 10:36:25.36	\N	CO2	5kg	Server room	2025-06-01 12:00:00
9a351d32-347b-49ee-a4c0-d80ebe31ac61	SN-20260603-64652	f2635f0d-fcb9-4c35-b28d-1410c102258f	SN-20260603-64652	2026-06-03 11:04:25.991	2027-06-03 11:04:25.991	2031-06-03 12:00:00	Serviced	\N	2026-06-03 10:37:05.995	2026-06-03 11:04:26.197	\N	Dry Powder ABC	5kg	Ground	2026-06-03 12:00:00
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: asset_histories asset_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_histories
    ADD CONSTRAINT asset_histories_pkey PRIMARY KEY (id);


--
-- Name: asset_service_records asset_service_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_service_records
    ADD CONSTRAINT asset_service_records_pkey PRIMARY KEY (id);


--
-- Name: fire_extinguisher_assets fire_extinguisher_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fire_extinguisher_assets
    ADD CONSTRAINT fire_extinguisher_assets_pkey PRIMARY KEY (id);


--
-- Name: asset_histories_assetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_histories_assetId_idx" ON public.asset_histories USING btree ("assetId");


--
-- Name: asset_histories_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_histories_createdAt_idx" ON public.asset_histories USING btree ("createdAt");


--
-- Name: asset_service_records_assetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_service_records_assetId_idx" ON public.asset_service_records USING btree ("assetId");


--
-- Name: asset_service_records_serviceDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "asset_service_records_serviceDate_idx" ON public.asset_service_records USING btree ("serviceDate");


--
-- Name: fire_extinguisher_assets_assetCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "fire_extinguisher_assets_assetCode_key" ON public.fire_extinguisher_assets USING btree ("assetCode");


--
-- Name: fire_extinguisher_assets_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "fire_extinguisher_assets_customerId_idx" ON public.fire_extinguisher_assets USING btree ("customerId");


--
-- Name: fire_extinguisher_assets_expirationDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "fire_extinguisher_assets_expirationDate_idx" ON public.fire_extinguisher_assets USING btree ("expirationDate");


--
-- Name: fire_extinguisher_assets_serialNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "fire_extinguisher_assets_serialNumber_idx" ON public.fire_extinguisher_assets USING btree ("serialNumber");


--
-- Name: fire_extinguisher_assets_serialNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "fire_extinguisher_assets_serialNumber_key" ON public.fire_extinguisher_assets USING btree ("serialNumber");


--
-- Name: fire_extinguisher_assets_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fire_extinguisher_assets_status_idx ON public.fire_extinguisher_assets USING btree (status);


--
-- Name: fire_extinguisher_assets_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fire_extinguisher_assets_type_idx ON public.fire_extinguisher_assets USING btree (type);


--
-- Name: asset_histories asset_histories_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_histories
    ADD CONSTRAINT "asset_histories_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.fire_extinguisher_assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: asset_service_records asset_service_records_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_service_records
    ADD CONSTRAINT "asset_service_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.fire_extinguisher_assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tnb3rDKgEXwVjaMuR1o7ucimRf1oJre1erTu9M7zdYix6Xre0yL1F0Z49AwDase

