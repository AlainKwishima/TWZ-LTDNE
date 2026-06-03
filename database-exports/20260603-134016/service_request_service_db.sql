--
-- PostgreSQL database dump
--

\restrict abOnqwyAd2Ewn8QxVh7Umm9KgNNbfBjczXxNtgzfo8GwO0bOwUiEhkXGDrzIt3d

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
-- Name: ServiceRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ServiceRequestStatus" AS ENUM (
    'Pending',
    'Assigned',
    'InProgress',
    'Completed',
    'Cancelled'
);


--
-- Name: ServiceRequestType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ServiceRequestType" AS ENUM (
    'Refill',
    'Inspection',
    'Replacement',
    'TechnicianVisit'
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
-- Name: service_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_completions (
    id text NOT NULL,
    "serviceRequestId" text NOT NULL,
    "technicianId" text NOT NULL,
    "completedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    summary text NOT NULL,
    "workPerformed" text,
    "partsUsed" text,
    "nextServiceDate" timestamp(3) without time zone,
    "nextExpirationDate" timestamp(3) without time zone
);


--
-- Name: service_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_notes (
    id text NOT NULL,
    "serviceRequestId" text NOT NULL,
    content text NOT NULL,
    "createdBy" text,
    "authorRole" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: service_request_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_request_activities (
    id text NOT NULL,
    "serviceRequestId" text NOT NULL,
    "eventType" text NOT NULL,
    description text NOT NULL,
    "actorId" text,
    "actorRole" text,
    "oldStatus" public."ServiceRequestStatus",
    "newStatus" public."ServiceRequestStatus",
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id text NOT NULL,
    "requestNumber" text NOT NULL,
    "customerId" text NOT NULL,
    "assetId" text NOT NULL,
    "requestedByUserId" text,
    type public."ServiceRequestType" NOT NULL,
    status public."ServiceRequestStatus" DEFAULT 'Pending'::public."ServiceRequestStatus" NOT NULL,
    description text,
    "scheduledDate" timestamp(3) without time zone,
    priority text DEFAULT 'normal'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: technician_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technician_assignments (
    id text NOT NULL,
    "serviceRequestId" text NOT NULL,
    "technicianId" text NOT NULL,
    "technicianName" text,
    "assignedBy" text,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
28ce4115-7a14-4443-814a-af3b718c74f6	11133a06d3df8153e370b0c0f51282d7e72f9c3219b693dbb41b58b2b6235404	2026-05-31 21:35:42.675763+00	20250530120000_init	\N	\N	2026-05-31 21:35:42.594409+00	1
dec39932-c111-4d37-a4bc-8a3c5ed3594f	2eb2052581847cb7e2f0bfda39775625c3eaed8af6558ca3fe775b59d9e99834	2026-06-03 10:57:03.531709+00	20260602000000_service_request_activity	\N	\N	2026-06-03 10:57:03.450413+00	1
\.


--
-- Data for Name: service_completions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_completions (id, "serviceRequestId", "technicianId", "completedAt", summary, "workPerformed", "partsUsed", "nextServiceDate", "nextExpirationDate") FROM stdin;
bffab552-0938-4f42-8473-a8f1d90d9c63	0b69793a-af5c-463c-9a24-1765fd7a724f	967b8ddb-5116-425f-ba5e-46c79aa07909	2026-06-03 11:04:25.991	wggtw	wgtgrt	\N	2027-06-03 11:04:25.991	\N
\.


--
-- Data for Name: service_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_notes (id, "serviceRequestId", content, "createdBy", "authorRole", "createdAt") FROM stdin;
5e58ef91-54ee-4954-9bd1-265252525874	00000000-0000-4000-8000-000000000601	Customer reported low pressure gauge reading.	customer@fems.local	Customer	2026-05-31 21:36:02.574
f97c7466-16ed-48c5-a167-459bf7a4a30f	00000000-0000-4000-8000-000000000603	Technician en route ΓÇô ETA 30 minutes.	tech@fems.local	Technician	2026-05-31 21:36:02.615
\.


--
-- Data for Name: service_request_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_request_activities (id, "serviceRequestId", "eventType", description, "actorId", "actorRole", "oldStatus", "newStatus", metadata, "createdAt") FROM stdin;
7138a6ea-8dc8-418b-84a3-950a8b5b496c	0b69793a-af5c-463c-9a24-1765fd7a724f	CREATED	Maintenance request SR-20260603-2619 submitted (Refill)	f2635f0d-fcb9-4c35-b28d-1410c102258f	User	\N	Pending	{"type": "Refill", "assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61"}	2026-06-03 11:02:51.461
cfabe354-6a18-43a5-8032-661fd3750251	0b69793a-af5c-463c-9a24-1765fd7a724f	INSPECTOR_ASSIGNED	Inspector John Kagabo assigned	40ff09c7-d930-499a-9b4a-51fdbbcb815d	Admin	Pending	Assigned	{"technicianId": "967b8ddb-5116-425f-ba5e-46c79aa07909", "technicianName": "John Kagabo"}	2026-06-03 11:03:24.654
8ced0883-7ffa-4d66-b442-e36ef4b93b59	0b69793a-af5c-463c-9a24-1765fd7a724f	STATUS_CHANGED	Status changed from Assigned to InProgress	967b8ddb-5116-425f-ba5e-46c79aa07909	Inspector	Assigned	InProgress	\N	2026-06-03 11:04:12.737
49697c09-4928-4075-acec-02dc6bd6a2ca	0b69793a-af5c-463c-9a24-1765fd7a724f	COMPLETED	Request SR-20260603-2619 completed: wggtw	967b8ddb-5116-425f-ba5e-46c79aa07909	Inspector	InProgress	Completed	{"summary": "wggtw", "workPerformed": "wgtgrt", "technicianName": "thepeakyblinda@gmail.com"}	2026-06-03 11:04:26.252
\.


--
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_requests (id, "requestNumber", "customerId", "assetId", "requestedByUserId", type, status, description, "scheduledDate", priority, "createdAt", "updatedAt") FROM stdin;
00000000-0000-4000-8000-000000000601	SR-20250530-0001	00000000-0000-4000-8000-000000000001	00000000-0000-4000-8000-000000000010	seed-customer-user	Refill	Pending	Dry powder extinguisher needs refill ΓÇô lobby unit	\N	normal	2026-05-31 21:36:02.574	2026-05-31 21:36:02.574
00000000-0000-4000-8000-000000000602	SR-20250530-0002	00000000-0000-4000-8000-000000000001	00000000-0000-4000-8000-000000000010	seed-customer-user	Inspection	Assigned	Annual inspection for server room CO2 unit	2026-07-01 21:36:02.603	high	2026-05-31 21:36:02.605	2026-05-31 21:36:02.605
00000000-0000-4000-8000-000000000603	SR-20250530-0003	00000000-0000-4000-8000-000000000001	00000000-0000-4000-8000-000000000010	\N	TechnicianVisit	InProgress	On-site visit for multiple lobby extinguishers	\N	normal	2026-05-31 21:36:02.615	2026-05-31 21:36:02.615
8923225a-96f3-4794-a98d-5bd1f793246f	SR-20260603-8462	f2635f0d-fcb9-4c35-b28d-1410c102258f	9a351d32-347b-49ee-a4c0-d80ebe31ac61	f2635f0d-fcb9-4c35-b28d-1410c102258f	Inspection	Cancelled	uihvoiudhvidfouhorfiugr	2026-06-23 10:37:00	normal	2026-06-03 10:37:56.812	2026-06-03 10:39:00.482
0b69793a-af5c-463c-9a24-1765fd7a724f	SR-20260603-2619	f2635f0d-fcb9-4c35-b28d-1410c102258f	9a351d32-347b-49ee-a4c0-d80ebe31ac61	f2635f0d-fcb9-4c35-b28d-1410c102258f	Refill	Completed	ergqwergtrwgrwtgrt5gwgtrwgwg	2026-06-30 11:02:00	normal	2026-06-03 11:02:51.41	2026-06-03 11:04:25.994
\.


--
-- Data for Name: technician_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.technician_assignments (id, "serviceRequestId", "technicianId", "technicianName", "assignedBy", "assignedAt", notes) FROM stdin;
28dd5ed4-b4be-46e0-80f2-f3187f978e29	00000000-0000-4000-8000-000000000602	seed-technician-user	Field Technician	staff@fems.local	2026-05-31 21:36:02.605	Schedule during low-traffic hours
3f90f435-db7e-4c16-94df-1565bbcc5e39	00000000-0000-4000-8000-000000000603	seed-technician-user	Field Technician	admin@fems.local	2026-05-31 21:36:02.615	\N
b653e1ce-b2c7-45be-a922-2f0c90788672	0b69793a-af5c-463c-9a24-1765fd7a724f	967b8ddb-5116-425f-ba5e-46c79aa07909	John Kagabo	40ff09c7-d930-499a-9b4a-51fdbbcb815d	2026-06-03 11:03:24.58	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: service_completions service_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_completions
    ADD CONSTRAINT service_completions_pkey PRIMARY KEY (id);


--
-- Name: service_notes service_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_notes
    ADD CONSTRAINT service_notes_pkey PRIMARY KEY (id);


--
-- Name: service_request_activities service_request_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_activities
    ADD CONSTRAINT service_request_activities_pkey PRIMARY KEY (id);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: technician_assignments technician_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technician_assignments
    ADD CONSTRAINT technician_assignments_pkey PRIMARY KEY (id);


--
-- Name: service_completions_completedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_completions_completedAt_idx" ON public.service_completions USING btree ("completedAt");


--
-- Name: service_completions_serviceRequestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "service_completions_serviceRequestId_key" ON public.service_completions USING btree ("serviceRequestId");


--
-- Name: service_completions_technicianId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_completions_technicianId_idx" ON public.service_completions USING btree ("technicianId");


--
-- Name: service_notes_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_notes_createdAt_idx" ON public.service_notes USING btree ("createdAt");


--
-- Name: service_notes_serviceRequestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_notes_serviceRequestId_idx" ON public.service_notes USING btree ("serviceRequestId");


--
-- Name: service_request_activities_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_request_activities_createdAt_idx" ON public.service_request_activities USING btree ("createdAt");


--
-- Name: service_request_activities_serviceRequestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_request_activities_serviceRequestId_idx" ON public.service_request_activities USING btree ("serviceRequestId");


--
-- Name: service_requests_assetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_requests_assetId_idx" ON public.service_requests USING btree ("assetId");


--
-- Name: service_requests_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_requests_createdAt_idx" ON public.service_requests USING btree ("createdAt");


--
-- Name: service_requests_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "service_requests_customerId_idx" ON public.service_requests USING btree ("customerId");


--
-- Name: service_requests_requestNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "service_requests_requestNumber_key" ON public.service_requests USING btree ("requestNumber");


--
-- Name: service_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_requests_status_idx ON public.service_requests USING btree (status);


--
-- Name: service_requests_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_requests_type_idx ON public.service_requests USING btree (type);


--
-- Name: technician_assignments_serviceRequestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "technician_assignments_serviceRequestId_key" ON public.technician_assignments USING btree ("serviceRequestId");


--
-- Name: technician_assignments_technicianId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "technician_assignments_technicianId_idx" ON public.technician_assignments USING btree ("technicianId");


--
-- Name: service_completions service_completions_serviceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_completions
    ADD CONSTRAINT "service_completions_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES public.service_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_notes service_notes_serviceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_notes
    ADD CONSTRAINT "service_notes_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES public.service_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_request_activities service_request_activities_serviceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_request_activities
    ADD CONSTRAINT "service_request_activities_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES public.service_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: technician_assignments technician_assignments_serviceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technician_assignments
    ADD CONSTRAINT "technician_assignments_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES public.service_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict abOnqwyAd2Ewn8QxVh7Umm9KgNNbfBjczXxNtgzfo8GwO0bOwUiEhkXGDrzIt3d

