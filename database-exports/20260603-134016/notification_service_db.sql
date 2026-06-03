--
-- PostgreSQL database dump
--

\restrict pnUhLILFCMfv9elOwMqH2lzneIUz49bsLme01UIxCyuM6gsiu7mAvQTwIj1Bkpn

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
-- Name: NotificationCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationCategory" AS ENUM (
    'Order',
    'Invoice',
    'Asset',
    'Service',
    'Escalation',
    'Expiry',
    'System'
);


--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'Email',
    'SMS',
    'InApp'
);


--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'Pending',
    'Sent',
    'Failed',
    'Delivered',
    'Acknowledged'
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
-- Name: expiry_alert_trackers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expiry_alert_trackers (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "assetCode" text NOT NULL,
    "customerId" text NOT NULL,
    "userId" text,
    "expirationDate" timestamp(3) without time zone NOT NULL,
    "alert30Sent" boolean DEFAULT false NOT NULL,
    "alert7Sent" boolean DEFAULT false NOT NULL,
    "alertOnExpirySent" boolean DEFAULT false NOT NULL,
    "alertOverdueSent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customerSeenAt" timestamp(3) without time zone,
    "refillBookedAt" timestamp(3) without time zone,
    "alertsResolvedAt" timestamp(3) without time zone,
    "lastReminderSentAt" timestamp(3) without time zone,
    "policeReportSent" boolean DEFAULT false NOT NULL
);


--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_logs (
    id text NOT NULL,
    "notificationId" text NOT NULL,
    action text NOT NULL,
    channel public."NotificationChannel" NOT NULL,
    detail text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_templates (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    channel public."NotificationChannel" NOT NULL,
    subject text,
    body text NOT NULL,
    "htmlBody" text,
    "eventType" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text,
    "customerId" text,
    "recipientEmail" text,
    "recipientPhone" text,
    channel public."NotificationChannel" NOT NULL,
    category public."NotificationCategory" DEFAULT 'System'::public."NotificationCategory" NOT NULL,
    subject text,
    body text NOT NULL,
    status public."NotificationStatus" DEFAULT 'Pending'::public."NotificationStatus" NOT NULL,
    "eventType" text,
    "eventPayload" jsonb,
    "templateId" text,
    "seenAt" timestamp(3) without time zone,
    "acknowledgedAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    "failureReason" text,
    "resendCount" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3cee2a97-1137-4a58-bee4-881de6d2d95a	ad27ff76c3b33af1f08b304c78245fa2ec5d1f9b8c77d3891138927887aff66c	2026-05-31 21:35:38.419727+00	20250530000000_init	\N	\N	2026-05-31 21:35:38.294354+00	1
3fd205df-e9bf-4c21-ac8f-b7abe49feda5	8dfebb671c9f8d6738c1121387e838bbbd650c6805b0b5f763f6c2d89b671bd7	2026-05-31 21:35:38.437928+00	20260530120000_expiry_reminder_tracking	\N	\N	2026-05-31 21:35:38.423125+00	1
\.


--
-- Data for Name: expiry_alert_trackers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expiry_alert_trackers (id, "assetId", "assetCode", "customerId", "userId", "expirationDate", "alert30Sent", "alert7Sent", "alertOnExpirySent", "alertOverdueSent", "createdAt", "updatedAt", "customerSeenAt", "refillBookedAt", "alertsResolvedAt", "lastReminderSentAt", "policeReportSent") FROM stdin;
a9cdc86e-6f65-4e19-a58d-1e9746afdd22	00000000-0000-4000-8000-000000000501	FE-10001	00000000-0000-4000-8000-000000000001	00000000-0000-4000-8000-000000000101	2026-06-25 21:35:59.868	f	f	f	f	2026-05-31 21:35:59.869	2026-06-03 08:21:24.484	2026-06-03 08:21:24.483	\N	\N	2026-06-03 07:45:14.189	f
5139d92f-835c-44da-bfba-773b901c14c3	09e2cfec-46b6-4afe-9e90-20d474f5a3ff	SN-20250601-10002	cece529d-43d4-4fab-a1a2-13725ea82017	cece529d-43d4-4fab-a1a2-13725ea82017	2026-07-01 12:00:00	f	f	f	f	2026-06-03 10:55:24.933	2026-06-03 11:31:38.044	\N	\N	\N	2026-06-03 10:55:25.141	f
846af41e-c56e-45b4-a093-a60c7f377ecb	f2394ee9-6505-40df-879a-4007ed0f8759	FE-10002	cece529d-43d4-4fab-a1a2-13725ea82017	cece529d-43d4-4fab-a1a2-13725ea82017	2026-07-01 21:35:54.281	f	f	f	f	2026-05-31 21:39:20.552	2026-06-03 11:31:38.087	2026-06-03 08:21:22.315	\N	\N	2026-06-03 07:45:14.189	f
e5cf7001-f6df-4d5e-bd93-c5ceff3e7e95	fefd5ace-204c-4f0c-b8a8-2e9757c6c3e4	FE-10001	cece529d-43d4-4fab-a1a2-13725ea82017	cece529d-43d4-4fab-a1a2-13725ea82017	2030-05-28 00:00:00	f	f	f	f	2026-05-31 21:39:20.58	2026-06-03 11:31:38.117	\N	\N	\N	\N	f
6f34da65-592f-4bb1-ae5d-7836dff1d49a	fa774722-5a86-43c4-ba5a-9247fc4dfc6d	SN-20250528-10001	cece529d-43d4-4fab-a1a2-13725ea82017	cece529d-43d4-4fab-a1a2-13725ea82017	2030-05-28 12:00:00	f	f	f	f	2026-06-03 10:55:24.999	2026-06-03 11:31:38.137	\N	\N	\N	\N	f
bf42071b-7b85-472e-b408-73097ea45661	9a351d32-347b-49ee-a4c0-d80ebe31ac61	SN-20260603-64652	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	2031-06-03 12:00:00	f	f	f	f	2026-06-03 10:37:06.444	2026-06-03 11:31:38.158	\N	\N	\N	\N	f
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_logs (id, "notificationId", action, channel, detail, metadata, "createdAt") FROM stdin;
39d6859b-4714-4df6-a9fb-3d7d03efa61f	0bf0db8c-3019-4d2a-ba22-b2cb53798b73	SENT	InApp	Seed welcome notification	\N	2026-05-31 21:35:59.859
b903a11b-e73a-4922-859b-c349d4f1a9b1	ef1f07e6-bea5-401c-8d21-b74ddb3e7c52	SENT	Email	Notification dispatched successfully	{"preview": "{\\"from\\":{\\"address\\":\\"noreply@fems.local\\",\\"name\\":\\"FEMS\\"},\\"to\\":[{\\"address\\":\\"customer@fems.local\\",\\"name\\":\\"\\"}],\\"subject\\":\\"Extinguisher FE-10001 ΓÇö 25 day(s) until expiry\\",\\"text\\":\\"Extinguisher FE-10001 expires on 25 June 2026 (25 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.\\",\\"html\\":\\"Extinguisher FE-10001 expires on 25 June 2026 (25 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.\\",\\"headers\\":{},\\"messageId\\":\\"<00e37535-2c8c-3fe9-f2dc-dddc7f2ed0ea@fems.local>\\"}", "messageId": "<00e37535-2c8c-3fe9-f2dc-dddc7f2ed0ea@fems.local>"}	2026-05-31 21:39:20.897
d0df1f64-c1f0-4a77-bc97-d1c34bfae441	5eb674a5-3cb8-496f-ad78-bd5866c34827	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-05-31 21:39:20.951
ae8b3ae6-bfdb-4a77-91b9-a44a112928ad	91f69077-6125-40ec-8379-4db19cd211d8	FAILED	Email	Recipient email required	\N	2026-05-31 21:39:21.071
fee10af9-3c8c-4d70-88fd-9f9d8c934172	99cd089a-5a15-4136-b917-587624a1b4f5	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-05-31 21:39:21.128
7cc5278a-975e-4be9-a8a7-e8d4846824cf	092c9f7e-0286-4960-abee-16e417f00f59	SENT	Email	Notification dispatched successfully	{"provider": "brevo", "messageId": "<202606030745.31489990312@smtp-relay.mailin.fr>", "deliveredTo": "customer@fems.local"}	2026-06-03 07:45:14.766
f3242a90-3157-4f79-b037-d010e0dc2daa	bc667337-ce7f-4237-8ca1-1f97b339b0b3	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 07:45:14.816
b23bb816-f148-4a86-87a2-dac9c99e5201	d51e6a25-8bc7-4759-a853-786f958310d4	FAILED	Email	Recipient email required	\N	2026-06-03 07:45:14.959
8b0b4c02-bd54-4380-8279-c9510b92e777	bf2702b8-af14-4f6f-bb04-6532b60d880b	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 07:45:15.031
f1e265c5-8511-4984-addb-baab6baa4567	bf2702b8-af14-4f6f-bb04-6532b60d880b	SEEN	InApp	Notification marked as seen	\N	2026-06-03 08:21:22.304
1e3cda2d-9495-4e8a-9533-17124dbe89d0	d51e6a25-8bc7-4759-a853-786f958310d4	SEEN	Email	Notification marked as seen	\N	2026-06-03 08:21:23.828
afc8f632-582e-49cf-b690-1c7f85dcc5da	bc667337-ce7f-4237-8ca1-1f97b339b0b3	SEEN	InApp	Notification marked as seen	\N	2026-06-03 08:21:24.472
1ad28a5d-0bee-435c-808f-c8a72197bbbd	092c9f7e-0286-4960-abee-16e417f00f59	SEEN	Email	Notification marked as seen	\N	2026-06-03 08:21:25.458
0705336c-3700-4a4d-8ee9-d84a2c0329d1	99cd089a-5a15-4136-b917-587624a1b4f5	SEEN	InApp	Notification marked as seen	\N	2026-06-03 08:21:26.175
d5e7469f-e0f8-4eb6-b3a4-9d3add3cb302	91f69077-6125-40ec-8379-4db19cd211d8	SEEN	Email	Notification marked as seen	\N	2026-06-03 08:21:26.973
b7b48f36-b1b3-4fc9-bdeb-588d4c35d959	afde7922-fbaa-4a01-866c-f6d5e01ab6f1	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 10:37:06.686
c4bd4739-2161-49e6-ab3e-77e4f2a48e36	685b395a-2a4f-4eb9-94fc-de575980d554	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 10:37:06.687
54f8923a-c577-40bf-8701-9c44c60c8688	afde7922-fbaa-4a01-866c-f6d5e01ab6f1	SEEN	InApp	Notification marked as seen	\N	2026-06-03 10:41:19.317
ad5d26f3-d14b-480d-92ec-067a348411c4	685b395a-2a4f-4eb9-94fc-de575980d554	SEEN	InApp	Notification marked as seen	\N	2026-06-03 10:41:20.402
9dd50050-98d4-4ee0-a296-e7191c3169a0	487a5c55-7a4f-4cbe-89a5-29c18d82258e	SENT	Email	Notification dispatched successfully	{"provider": "brevo", "messageId": "<202606031055.80417610329@smtp-relay.mailin.fr>", "deliveredTo": "user@fems.local"}	2026-06-03 10:55:26.15
e3d2cb39-effb-4982-8d4a-a31fa98c9acf	05f42ec6-5603-425a-aeaf-ed1522e37078	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 10:55:26.198
75827072-3f16-427a-aff7-0cbf0cb57cf0	139c99a0-cd64-4130-bcc9-44f86266f531	FAILED	Email	Failed to send email via Brevo: fetch failed	\N	2026-06-03 11:02:51.906
16a57b01-1573-4c50-9a12-b7ec1944bc8e	3e23eede-912b-4bd7-a36f-6cf6d126098c	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 11:02:51.941
1413f24a-feea-4ad2-be74-979874208de7	3e23eede-912b-4bd7-a36f-6cf6d126098c	SEEN	InApp	Notification marked as seen	\N	2026-06-03 11:03:48.614
c9e765e2-babb-47af-9a6f-79939636c85e	bdf57fb6-6f52-4ca6-a658-6b6cee4ab2ec	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 11:04:12.922
876e439d-c776-4e2c-8368-9194252f3601	d3cbe8f5-1c0b-44d3-afcf-60f4ad705521	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 11:04:12.963
699d16db-0958-486b-bb5b-257e643b5820	9982bf75-66e8-40de-8252-36dd8db981fa	SENT	Email	Notification dispatched successfully	{"provider": "brevo", "messageId": "<202606031104.85293725331@smtp-relay.mailin.fr>", "deliveredTo": "jacksoncoolaid@gmail.com"}	2026-06-03 11:04:27.138
5a3b3af2-6b29-492c-be28-ae3661ebdbf8	4c61ec46-f1f0-4121-a826-24b6b0e24810	SENT	InApp	Notification dispatched successfully	{"detail": "In-app notification created"}	2026-06-03 11:04:27.163
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_templates (id, code, name, channel, subject, body, "htmlBody", "eventType", "isActive", "createdAt", "updatedAt") FROM stdin;
5ef34378-4ebe-464b-8b43-c051f86508cf	asset-expiring-sms	Asset Expiring Soon SMS	SMS	\N	FEMS Alert: Asset {{assetCode}} expires on {{expirationDate}}. Schedule service soon.	\N	AssetExpiringSoon	t	2026-05-31 21:35:59.826	2026-06-03 07:42:56.594
4d9c90fb-7058-4f45-9eda-a4c2783c608d	expiry-30-days-inapp	Expiry 30-Day In-App	InApp	30-day expiry reminder	Extinguisher {{assetCode}} expires on {{expirationDate}}.	\N	ExpiryAlert30	t	2026-05-31 21:39:20.032	2026-06-03 11:31:37.543
86d25821-76cf-4555-be68-65efbb91143b	expiry-7-days-inapp	Expiry 7-Day In-App	InApp	7-day expiry reminder	Extinguisher {{assetCode}} expires in 7 days ({{expirationDate}}).	\N	ExpiryAlert7	t	2026-05-31 21:39:20.057	2026-06-03 11:31:37.558
74915de4-d1a4-4dcf-a858-41b6d06f5eb5	expiry-overdue-inapp	Expiry Overdue In-App	InApp	Extinguisher overdue	Extinguisher {{assetCode}} is overdue since {{expirationDate}}.	\N	ExpiryAlertOverdue	t	2026-05-31 21:39:20.095	2026-06-03 11:31:37.605
1e57f97f-778d-45e7-96f8-b7def1e3bae6	inspection-overdue-inapp	Inspection Overdue In-App	InApp	Inspection overdue ΓÇö {{requestNumber}}	Service request {{requestNumber}} is {{daysOverdue}} day(s) past its scheduled inspection date.	\N	INSPECTION_OVERDUE	t	2026-06-03 07:45:13.949	2026-06-03 11:31:37.741
c69fce27-4a7d-45ca-b2ca-9c2891b12310	asset-created-inapp	Asset Created In-App	InApp	New extinguisher registered	Fire extinguisher {{assetCode}} has been registered. Expires on {{expirationDate}}.	\N	AssetCreated	t	2026-05-31 21:35:59.822	2026-06-03 11:31:37.439
3ea86b3e-f020-4b25-ba4b-6eabd4bf8bcb	maintenance-overdue-email	Maintenance Overdue Email	Email	Maintenance overdue ΓÇö {{assetCode}}	Extinguisher {{assetCode}} is {{daysOverdue}} day(s) past due service (was due {{nextServiceDate}}).	\N	MAINTENANCE_REMINDER	t	2026-06-03 07:45:13.935	2026-06-03 11:31:37.72
1ddb09cf-56b4-4fd6-aa28-78c1185ccf92	service-completed-inapp	Service Completed In-App	InApp	Maintenance completed	Request {{requestNumber}} is now complete.	\N	ServiceCompleted	t	2026-06-03 10:55:17.043	2026-06-03 11:31:37.622
6d4e9711-79a5-41de-a345-32360807dbb2	asset-expired-inapp	Asset Expired In-App	InApp	Extinguisher expired	Extinguisher {{assetCode}} has expired. Immediate action required.	\N	AssetExpired	t	2026-05-31 21:35:59.83	2026-06-03 11:31:37.499
b307d805-1a6e-408b-8618-a723da65f0e0	expiry-reminder-inapp	Expiry Reminder In-App	InApp	{{alertSubject}}	{{alertBody}}	\N	ExpiryReminder	t	2026-05-31 21:39:20.018	2026-06-03 11:31:37.517
fdd60e13-6038-487a-942f-b0b60ceb2f89	maintenance-due-email	Maintenance Due Email	Email	Maintenance due ΓÇö {{assetCode}}	Extinguisher {{assetCode}} is due for service on {{nextServiceDate}} ({{daysUntilService}} days remaining).	\N	MAINTENANCE_REMINDER	t	2026-06-03 07:45:13.921	2026-06-03 11:31:37.702
7538e64e-b845-4eb8-99ac-1e24f5f5bb49	expiry-on-date-inapp	Expiry On Date In-App	InApp	Extinguisher expires today	Extinguisher {{assetCode}} expires today. Please arrange replacement or service.	\N	ExpiryAlertOnDate	t	2026-05-31 21:39:20.077	2026-06-03 11:31:37.579
36a07b41-1815-4744-98b0-bcfc3c722545	maintenance-overdue-inapp	Maintenance Overdue In-App	InApp	Maintenance overdue ΓÇö {{assetCode}}	Extinguisher {{assetCode}} is {{daysOverdue}} day(s) overdue for service.	\N	MAINTENANCE_REMINDER	t	2026-06-03 07:45:13.942	2026-06-03 11:31:37.732
7873341f-9274-4061-a291-31b2c44630db	expiry-overdue	Expiry Overdue Email	Email	OVERDUE: Extinguisher {{assetCode}}	Your fire extinguisher {{assetCode}} expired on {{expirationDate}} and is now overdue. Compliance action is required.	\N	ExpiryAlertOverdue	t	2026-05-31 21:35:59.847	2026-06-03 11:31:37.597
4f29199e-ed82-4029-931a-eb8883b31d47	expiry-reminder-email	Expiry Reminder Email	Email	{{alertSubject}}	{{alertBody}}	\N	ExpiryReminder	t	2026-05-31 21:39:20.006	2026-06-03 11:31:37.509
e6f698ba-d2ee-41ac-bba6-dce181c62c8c	service-completed-email	Service Completed Email	Email	Maintenance completed ΓÇö {{requestNumber}}	Your maintenance request {{requestNumber}} ({{type}}) has been completed.	\N	ServiceCompleted	t	2026-05-31 21:35:59.832	2026-06-03 11:31:37.616
81672c9d-631d-4621-a458-82f5182a3455	service-request-created-inapp	Service Request Created In-App	InApp	Maintenance request received	Your request {{requestNumber}} ({{type}}) was submitted and is pending assignment.	\N	ServiceRequested	t	2026-06-03 10:55:17.132	2026-06-03 11:31:37.63
017e9bbe-07ef-4c6e-8d57-4832b861cb38	maintenance-due-inapp	Maintenance Due In-App	InApp	Maintenance due ΓÇö {{assetCode}}	Extinguisher {{assetCode}} is due for service on {{nextServiceDate}}.	\N	MAINTENANCE_REMINDER	t	2026-06-03 07:45:13.928	2026-06-03 11:31:37.713
d3c3f855-2c5f-4f1d-9b81-683ee7a4e39b	escalation-created-inapp	Escalation Created In-App	InApp	Compliance escalation opened	Escalation {{escalationId}} opened: {{reason}}	\N	EscalationCreated	t	2026-05-31 21:35:59.835	2026-06-03 08:33:13.997
784bec04-6805-4c07-9e62-902659fed0ae	asset-expiring-email	Asset Expiring Soon Email	Email	Extinguisher {{assetCode}} expiring soon	Your fire extinguisher {{assetCode}} expires on {{expirationDate}}. Please schedule inspection or replacement.	\N	AssetExpiringSoon	t	2026-05-31 21:39:19.963	2026-06-03 11:31:37.46
c0af9b55-f6dc-490e-a77d-cdc6c295b6d5	expiry-30-days	Expiry 30-Day Reminder	Email	Extinguisher {{assetCode}} expires in 30 days	Reminder: Your fire extinguisher {{assetCode}} will expire on {{expirationDate}} (about 30 days remaining).	\N	ExpiryAlert30	t	2026-05-31 21:35:59.839	2026-06-03 11:31:37.524
b085243c-79ad-454f-b4c4-f1914f8b5c49	expiry-7-days	Expiry 7-Day Reminder	Email	Extinguisher {{assetCode}} expires in 7 days	Your fire extinguisher {{assetCode}} expires on {{expirationDate}} (7 days remaining). Please act soon.	\N	ExpiryAlert7	t	2026-05-31 21:35:59.842	2026-06-03 11:31:37.551
83c33c43-1735-426f-a9af-57c24a393f8e	order-completed-email	Order Completed Email	Email	Order {{orderNumber}} completed	Your order {{orderNumber}} has been completed. Total: RWF {{totalAmount}}.	<p>Your order <strong>{{orderNumber}}</strong> has been completed.</p><p>Total: RWF {{totalAmount}}</p>	OrderCompleted	t	2026-05-31 21:35:59.798	2026-06-03 08:33:13.612
9515eaff-0092-4755-a8a7-2f2e7303a2c9	invoice-generated-email	Invoice Generated Email	Email	Invoice {{invoiceNumber}} ready	Invoice {{invoiceNumber}} for order {{orderNumber}} is ready. Amount: RWF {{totalAmount}}.	\N	InvoiceGenerated	t	2026-05-31 21:35:59.819	2026-06-03 08:33:13.641
fb232817-87bc-454b-a17c-0409ac337938	expiry-on-date	Expiry On Date Email	Email	Extinguisher {{assetCode}} expires today	Your fire extinguisher {{assetCode}} expires today ({{expirationDate}}). Arrange replacement or service immediately.	\N	ExpiryAlertOnDate	t	2026-05-31 21:35:59.845	2026-06-03 11:31:37.568
ef54444c-089b-4dbb-b764-1ca1caf1a19b	asset-expiring-inapp	Asset Expiring Soon In-App	InApp	Extinguisher expiring soon	Extinguisher {{assetCode}} expires on {{expirationDate}}.	\N	AssetExpiringSoon	t	2026-05-31 21:39:19.973	2026-06-03 11:31:37.472
6df5cb52-a7c4-4fe6-8df6-2cdc05e677c1	asset-expired-email	Asset Expired Email	Email	URGENT: Extinguisher {{assetCode}} has expired	Your fire extinguisher {{assetCode}} expired on {{expirationDate}}. Replace or service it immediately to stay compliant.	\N	AssetExpired	t	2026-05-31 21:39:19.988	2026-06-03 11:31:37.485
5166034c-13dc-411d-adb3-b133685e6644	service-request-created-email	Service Request Created Email	Email	Maintenance request {{requestNumber}} received	We received your maintenance request {{requestNumber}} for {{type}}. You will be notified when an inspector is assigned.	\N	ServiceRequested	t	2026-06-03 10:55:17.196	2026-06-03 11:31:37.64
73a9c978-fffd-4953-ae16-8b976d0ba6bd	inspector-assigned-user-inapp	Inspector Assigned User In-App	InApp	Inspector assigned	{{technicianName}} has been assigned to your request {{requestNumber}}.	\N	TechnicianAssigned	t	2026-06-03 10:55:17.221	2026-06-03 11:31:37.653
4d3d6035-57d1-4489-a8a6-de5b46a1f1a1	inspector-assigned-user-email	Inspector Assigned User Email	Email	Inspector assigned to {{requestNumber}}	{{technicianName}} will handle your {{type}} request {{requestNumber}}.	\N	TechnicianAssigned	t	2026-06-03 10:55:17.235	2026-06-03 11:31:37.664
5737f143-0707-4c11-a21d-fa537b9e174d	inspector-assigned-inspector-inapp	Inspector Assigned Inspector In-App	InApp	New assignment	You were assigned maintenance request {{requestNumber}} ({{type}}).	\N	TechnicianAssigned	t	2026-06-03 10:55:17.246	2026-06-03 11:31:37.676
f28b8799-b012-4f62-a6c9-734a6e68d02f	inspector-assigned-inspector-email	Inspector Assigned Inspector Email	Email	Assigned: {{requestNumber}}	You have been assigned to maintenance request {{requestNumber}} ({{type}}). Log in to review and update progress.	\N	TechnicianAssigned	t	2026-06-03 10:55:17.258	2026-06-03 11:31:37.687
a71086aa-9a42-45b2-9f51-e0b0be32bf3a	service-status-inapp	Service Status In-App	InApp	Request {{requestNumber}} updated	Status is now {{newStatus}}.	\N	ServiceStatusChanged	t	2026-06-03 10:55:17.266	2026-06-03 11:31:37.695
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", "customerId", "recipientEmail", "recipientPhone", channel, category, subject, body, status, "eventType", "eventPayload", "templateId", "seenAt", "acknowledgedAt", "sentAt", "failedAt", "failureReason", "resendCount", metadata, "createdAt", "updatedAt") FROM stdin;
0bf0db8c-3019-4d2a-ba22-b2cb53798b73	00000000-0000-4000-8000-000000000101	00000000-0000-4000-8000-000000000001	\N	\N	InApp	System	Welcome to FEMS notifications	You will receive alerts about your fire extinguisher assets here.	Sent	\N	\N	c69fce27-4a7d-45ca-b2ca-9c2891b12310	\N	\N	2026-05-31 21:35:59.857	\N	\N	0	\N	2026-05-31 21:35:59.859	2026-05-31 21:35:59.859
ef1f07e6-bea5-401c-8d21-b74ddb3e7c52	00000000-0000-4000-8000-000000000101	00000000-0000-4000-8000-000000000001	customer@fems.local	+254700000004	Email	Expiry	Extinguisher FE-10001 ΓÇö 25 day(s) until expiry	Extinguisher FE-10001 expires on 25 June 2026 (25 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": "00000000-0000-4000-8000-000000000101", "assetId": "00000000-0000-4000-8000-000000000501", "alertBody": "Extinguisher FE-10001 expires on 25 June 2026 (25 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10001", "customerId": "00000000-0000-4000-8000-000000000001", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10001 ΓÇö 25 day(s) until expiry", "expiryDetail": "expires on 25 June 2026 (25 day(s) remaining)", "expiryStatus": "25 day(s) remaining", "daysRemaining": "25", "expirationDate": "2026-06-25", "expirationDateFormatted": "25 June 2026"}	4f29199e-ed82-4029-931a-eb8883b31d47	\N	\N	2026-05-31 21:39:20.877	\N	\N	0	\N	2026-05-31 21:39:20.805	2026-05-31 21:39:20.879
5eb674a5-3cb8-496f-ad78-bd5866c34827	00000000-0000-4000-8000-000000000101	00000000-0000-4000-8000-000000000001	customer@fems.local	+254700000004	InApp	Expiry	Extinguisher FE-10001 ΓÇö 25 day(s) until expiry	Extinguisher FE-10001 expires on 25 June 2026 (25 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": "00000000-0000-4000-8000-000000000101", "assetId": "00000000-0000-4000-8000-000000000501", "alertBody": "Extinguisher FE-10001 expires on 25 June 2026 (25 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10001", "customerId": "00000000-0000-4000-8000-000000000001", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10001 ΓÇö 25 day(s) until expiry", "expiryDetail": "expires on 25 June 2026 (25 day(s) remaining)", "expiryStatus": "25 day(s) remaining", "daysRemaining": "25", "expirationDate": "2026-06-25", "expirationDateFormatted": "25 June 2026"}	b307d805-1a6e-408b-8618-a723da65f0e0	\N	\N	2026-05-31 21:39:20.94	\N	\N	0	\N	2026-05-31 21:39:20.927	2026-05-31 21:39:20.942
bc667337-ce7f-4237-8ca1-1f97b339b0b3	00000000-0000-4000-8000-000000000101	00000000-0000-4000-8000-000000000001	customer@fems.local	+254700000004	InApp	Expiry	Extinguisher FE-10001 ΓÇö 23 day(s) until expiry	Extinguisher FE-10001 expires on 25 June 2026 (23 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": "00000000-0000-4000-8000-000000000101", "assetId": "00000000-0000-4000-8000-000000000501", "alertBody": "Extinguisher FE-10001 expires on 25 June 2026 (23 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10001", "customerId": "00000000-0000-4000-8000-000000000001", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10001 ΓÇö 23 day(s) until expiry", "expiryDetail": "expires on 25 June 2026 (23 day(s) remaining)", "expiryStatus": "23 day(s) remaining", "daysRemaining": "23", "expirationDate": "2026-06-25", "expirationDateFormatted": "25 June 2026"}	b307d805-1a6e-408b-8618-a723da65f0e0	2026-06-03 08:21:24.455	\N	2026-06-03 07:45:14.803	\N	\N	0	\N	2026-06-03 07:45:14.789	2026-06-03 08:21:24.456
092c9f7e-0286-4960-abee-16e417f00f59	00000000-0000-4000-8000-000000000101	00000000-0000-4000-8000-000000000001	customer@fems.local	+254700000004	Email	Expiry	Extinguisher FE-10001 ΓÇö 23 day(s) until expiry	Extinguisher FE-10001 expires on 25 June 2026 (23 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": "00000000-0000-4000-8000-000000000101", "assetId": "00000000-0000-4000-8000-000000000501", "alertBody": "Extinguisher FE-10001 expires on 25 June 2026 (23 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10001", "customerId": "00000000-0000-4000-8000-000000000001", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10001 ΓÇö 23 day(s) until expiry", "expiryDetail": "expires on 25 June 2026 (23 day(s) remaining)", "expiryStatus": "23 day(s) remaining", "daysRemaining": "23", "expirationDate": "2026-06-25", "expirationDateFormatted": "25 June 2026"}	4f29199e-ed82-4029-931a-eb8883b31d47	2026-06-03 08:21:25.43	\N	2026-06-03 07:45:14.75	\N	\N	0	\N	2026-06-03 07:45:14.271	2026-06-03 08:21:25.432
99cd089a-5a15-4136-b917-587624a1b4f5	\N	11111111-1111-1111-1111-111111111111	\N	\N	InApp	Expiry	Extinguisher FE-10002 ΓÇö 31 day(s) until expiry	Extinguisher FE-10002 expires on 1 July 2026 (31 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": null, "assetId": "f2394ee9-6505-40df-879a-4007ed0f8759", "alertBody": "Extinguisher FE-10002 expires on 1 July 2026 (31 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10002", "customerId": "11111111-1111-1111-1111-111111111111", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10002 ΓÇö 31 day(s) until expiry", "expiryDetail": "expires on 1 July 2026 (31 day(s) remaining)", "expiryStatus": "31 day(s) remaining", "daysRemaining": "31", "expirationDate": "2026-07-01", "expirationDateFormatted": "1 July 2026"}	b307d805-1a6e-408b-8618-a723da65f0e0	2026-06-03 08:21:26.161	\N	2026-05-31 21:39:21.115	\N	\N	0	\N	2026-05-31 21:39:21.102	2026-06-03 08:21:26.163
91f69077-6125-40ec-8379-4db19cd211d8	\N	11111111-1111-1111-1111-111111111111	\N	\N	Email	Expiry	Extinguisher FE-10002 ΓÇö 31 day(s) until expiry	Extinguisher FE-10002 expires on 1 July 2026 (31 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Failed	ExpiryReminder	{"userId": null, "assetId": "f2394ee9-6505-40df-879a-4007ed0f8759", "alertBody": "Extinguisher FE-10002 expires on 1 July 2026 (31 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10002", "customerId": "11111111-1111-1111-1111-111111111111", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10002 ΓÇö 31 day(s) until expiry", "expiryDetail": "expires on 1 July 2026 (31 day(s) remaining)", "expiryStatus": "31 day(s) remaining", "daysRemaining": "31", "expirationDate": "2026-07-01", "expirationDateFormatted": "1 July 2026"}	4f29199e-ed82-4029-931a-eb8883b31d47	2026-06-03 08:21:26.925	\N	\N	2026-05-31 21:39:21.046	Recipient email required	0	\N	2026-05-31 21:39:21.025	2026-06-03 08:21:26.927
bf2702b8-af14-4f6f-bb04-6532b60d880b	\N	11111111-1111-1111-1111-111111111111	\N	\N	InApp	Expiry	Extinguisher FE-10002 ΓÇö 29 day(s) until expiry	Extinguisher FE-10002 expires on 1 July 2026 (29 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": null, "assetId": "f2394ee9-6505-40df-879a-4007ed0f8759", "alertBody": "Extinguisher FE-10002 expires on 1 July 2026 (29 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10002", "customerId": "11111111-1111-1111-1111-111111111111", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10002 ΓÇö 29 day(s) until expiry", "expiryDetail": "expires on 1 July 2026 (29 day(s) remaining)", "expiryStatus": "29 day(s) remaining", "daysRemaining": "29", "expirationDate": "2026-07-01", "expirationDateFormatted": "1 July 2026"}	b307d805-1a6e-408b-8618-a723da65f0e0	2026-06-03 08:21:22.288	\N	2026-06-03 07:45:15.018	\N	\N	0	\N	2026-06-03 07:45:15	2026-06-03 08:21:22.289
d51e6a25-8bc7-4759-a853-786f958310d4	\N	11111111-1111-1111-1111-111111111111	\N	\N	Email	Expiry	Extinguisher FE-10002 ΓÇö 29 day(s) until expiry	Extinguisher FE-10002 expires on 1 July 2026 (29 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.	Failed	ExpiryReminder	{"userId": null, "assetId": "f2394ee9-6505-40df-879a-4007ed0f8759", "alertBody": "Extinguisher FE-10002 expires on 1 July 2026 (29 day(s) remaining). Open FEMS, mark this alert as read, and book a refill to stop reminders.", "assetCode": "FE-10002", "customerId": "11111111-1111-1111-1111-111111111111", "daysOverdue": "0", "alertSubject": "Extinguisher FE-10002 ΓÇö 29 day(s) until expiry", "expiryDetail": "expires on 1 July 2026 (29 day(s) remaining)", "expiryStatus": "29 day(s) remaining", "daysRemaining": "29", "expirationDate": "2026-07-01", "expirationDateFormatted": "1 July 2026"}	4f29199e-ed82-4029-931a-eb8883b31d47	2026-06-03 08:21:23.816	\N	\N	2026-06-03 07:45:14.931	Recipient email required	0	\N	2026-06-03 07:45:14.883	2026-06-03 08:21:23.817
afde7922-fbaa-4a01-866c-f6d5e01ab6f1	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	+250782171969	InApp	Asset	New extinguisher registered	Fire extinguisher SN-20260603-64652 has been registered. Expires on 2031-06-03T12:00:00.000Z.	Sent	AssetCreated	{"size": "5kg", "type": "Dry Powder ABC", "status": "Active", "assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "location": "Ground", "assetCode": "SN-20260603-64652", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "serialNumber": "SN-20260603-64652", "expirationDate": "2031-06-03T12:00:00.000Z"}	c69fce27-4a7d-45ca-b2ca-9c2891b12310	2026-06-03 10:41:19.309	\N	2026-06-03 10:37:06.661	\N	\N	0	\N	2026-06-03 10:37:06.621	2026-06-03 10:41:19.31
685b395a-2a4f-4eb9-94fc-de575980d554	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	+250782171969	InApp	Asset	New extinguisher registered	Fire extinguisher SN-20260603-64652 has been registered. Expires on 2031-06-03T12:00:00.000Z.	Sent	AssetCreated	{"size": "5kg", "type": "Dry Powder ABC", "status": "Active", "assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "location": "Ground", "assetCode": "SN-20260603-64652", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "serialNumber": "SN-20260603-64652", "expirationDate": "2031-06-03T12:00:00.000Z"}	c69fce27-4a7d-45ca-b2ca-9c2891b12310	2026-06-03 10:41:20.392	\N	2026-06-03 10:37:06.663	\N	\N	0	\N	2026-06-03 10:37:06.613	2026-06-03 10:41:20.393
487a5c55-7a4f-4cbe-89a5-29c18d82258e	cece529d-43d4-4fab-a1a2-13725ea82017	cece529d-43d4-4fab-a1a2-13725ea82017	user@fems.local	+254700000004	Email	Expiry	Extinguisher SN-20250601-10002 ΓÇö 29 day(s) until expiry	Extinguisher SN-20250601-10002 expires on 1 July 2026 (29 day(s) remaining). Open TWZ LTD, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": "cece529d-43d4-4fab-a1a2-13725ea82017", "assetId": "09e2cfec-46b6-4afe-9e90-20d474f5a3ff", "alertBody": "Extinguisher SN-20250601-10002 expires on 1 July 2026 (29 day(s) remaining). Open TWZ LTD, mark this alert as read, and book a refill to stop reminders.", "assetCode": "SN-20250601-10002", "customerId": "cece529d-43d4-4fab-a1a2-13725ea82017", "daysOverdue": "0", "alertSubject": "Extinguisher SN-20250601-10002 ΓÇö 29 day(s) until expiry", "expiryDetail": "expires on 1 July 2026 (29 day(s) remaining)", "expiryStatus": "29 day(s) remaining", "daysRemaining": "29", "expirationDate": "2026-07-01", "expirationDateFormatted": "1 July 2026"}	4f29199e-ed82-4029-931a-eb8883b31d47	\N	\N	2026-06-03 10:55:26.129	\N	\N	0	\N	2026-06-03 10:55:25.229	2026-06-03 10:55:26.13
05f42ec6-5603-425a-aeaf-ed1522e37078	cece529d-43d4-4fab-a1a2-13725ea82017	cece529d-43d4-4fab-a1a2-13725ea82017	user@fems.local	+254700000004	InApp	Expiry	Extinguisher SN-20250601-10002 ΓÇö 29 day(s) until expiry	Extinguisher SN-20250601-10002 expires on 1 July 2026 (29 day(s) remaining). Open TWZ LTD, mark this alert as read, and book a refill to stop reminders.	Sent	ExpiryReminder	{"userId": "cece529d-43d4-4fab-a1a2-13725ea82017", "assetId": "09e2cfec-46b6-4afe-9e90-20d474f5a3ff", "alertBody": "Extinguisher SN-20250601-10002 expires on 1 July 2026 (29 day(s) remaining). Open TWZ LTD, mark this alert as read, and book a refill to stop reminders.", "assetCode": "SN-20250601-10002", "customerId": "cece529d-43d4-4fab-a1a2-13725ea82017", "daysOverdue": "0", "alertSubject": "Extinguisher SN-20250601-10002 ΓÇö 29 day(s) until expiry", "expiryDetail": "expires on 1 July 2026 (29 day(s) remaining)", "expiryStatus": "29 day(s) remaining", "daysRemaining": "29", "expirationDate": "2026-07-01", "expirationDateFormatted": "1 July 2026"}	b307d805-1a6e-408b-8618-a723da65f0e0	\N	\N	2026-06-03 10:55:26.188	\N	\N	0	\N	2026-06-03 10:55:26.169	2026-06-03 10:55:26.189
139c99a0-cd64-4130-bcc9-44f86266f531	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	+250782171969	Email	Service	Maintenance request SR-20260603-2619 received	We received your maintenance request SR-20260603-2619 for Refill. You will be notified when an inspector is assigned.	Failed	ServiceRequested	{"type": "Refill", "status": "Pending", "assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "eventKind": "CREATED", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "description": "ergqwergtrwgrwtgrt5gwgtrwgwg", "requestNumber": "SR-20260603-2619", "serviceRequestId": "0b69793a-af5c-463c-9a24-1765fd7a724f", "requestedByUserId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}	5166034c-13dc-411d-adb3-b133685e6644	\N	\N	\N	2026-06-03 11:02:51.887	Failed to send email via Brevo: fetch failed	0	\N	2026-06-03 11:02:51.756	2026-06-03 11:02:51.888
3e23eede-912b-4bd7-a36f-6cf6d126098c	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	+250782171969	InApp	Service	Maintenance request received	Your request SR-20260603-2619 (Refill) was submitted and is pending assignment.	Sent	ServiceRequested	{"type": "Refill", "status": "Pending", "assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "eventKind": "CREATED", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "description": "ergqwergtrwgrwtgrt5gwgtrwgwg", "requestNumber": "SR-20260603-2619", "serviceRequestId": "0b69793a-af5c-463c-9a24-1765fd7a724f", "requestedByUserId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}	81672c9d-631d-4621-a458-82f5182a3455	2026-06-03 11:03:48.562	\N	2026-06-03 11:02:51.931	\N	\N	0	\N	2026-06-03 11:02:51.92	2026-06-03 11:03:48.563
bdf57fb6-6f52-4ca6-a658-6b6cee4ab2ec	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	+250782171969	InApp	Service	Request SR-20260603-2619 updated	Status is now InProgress.	Sent	ServiceStatusChanged	{"type": "Refill", "status": "InProgress", "assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "eventKind": "STATUS_CHANGED", "newStatus": "InProgress", "oldStatus": "Assigned", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "description": "ergqwergtrwgrwtgrt5gwgtrwgwg", "technicianId": "967b8ddb-5116-425f-ba5e-46c79aa07909", "requestNumber": "SR-20260603-2619", "technicianName": "John Kagabo", "serviceRequestId": "0b69793a-af5c-463c-9a24-1765fd7a724f", "requestedByUserId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}	a71086aa-9a42-45b2-9f51-e0b0be32bf3a	\N	\N	2026-06-03 11:04:12.91	\N	\N	0	\N	2026-06-03 11:04:12.895	2026-06-03 11:04:12.911
d3cbe8f5-1c0b-44d3-afcf-60f4ad705521	967b8ddb-5116-425f-ba5e-46c79aa07909	\N	\N	\N	InApp	Service	Request SR-20260603-2619 updated	Status is now InProgress.	Sent	ServiceStatusChanged	{"type": "Refill", "status": "InProgress", "assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "eventKind": "STATUS_CHANGED", "newStatus": "InProgress", "oldStatus": "Assigned", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "description": "ergqwergtrwgrwtgrt5gwgtrwgwg", "technicianId": "967b8ddb-5116-425f-ba5e-46c79aa07909", "requestNumber": "SR-20260603-2619", "technicianName": "John Kagabo", "serviceRequestId": "0b69793a-af5c-463c-9a24-1765fd7a724f", "requestedByUserId": "f2635f0d-fcb9-4c35-b28d-1410c102258f"}	a71086aa-9a42-45b2-9f51-e0b0be32bf3a	\N	\N	2026-06-03 11:04:12.954	\N	\N	0	\N	2026-06-03 11:04:12.94	2026-06-03 11:04:12.955
9982bf75-66e8-40de-8252-36dd8db981fa	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	+250782171969	Email	Service	Maintenance completed ΓÇö {{requestNumber}}	Your maintenance request {{requestNumber}} ({{type}}) has been completed.	Sent	ServiceCompleted	{"assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "serviceType": "Refill", "technicianId": "967b8ddb-5116-425f-ba5e-46c79aa07909", "nextServiceDate": "2027-06-03T11:04:25.991Z", "serviceRequestId": "0b69793a-af5c-463c-9a24-1765fd7a724f"}	e6f698ba-d2ee-41ac-bba6-dce181c62c8c	\N	\N	2026-06-03 11:04:27.082	\N	\N	0	\N	2026-06-03 11:04:26.288	2026-06-03 11:04:27.083
4c61ec46-f1f0-4121-a826-24b6b0e24810	f2635f0d-fcb9-4c35-b28d-1410c102258f	f2635f0d-fcb9-4c35-b28d-1410c102258f	jacksoncoolaid@gmail.com	+250782171969	InApp	Service	Maintenance completed	Request {{requestNumber}} is now complete.	Sent	ServiceCompleted	{"assetId": "9a351d32-347b-49ee-a4c0-d80ebe31ac61", "customerId": "f2635f0d-fcb9-4c35-b28d-1410c102258f", "serviceType": "Refill", "technicianId": "967b8ddb-5116-425f-ba5e-46c79aa07909", "nextServiceDate": "2027-06-03T11:04:25.991Z", "serviceRequestId": "0b69793a-af5c-463c-9a24-1765fd7a724f"}	1ddb09cf-56b4-4fd6-aa28-78c1185ccf92	\N	\N	2026-06-03 11:04:27.155	\N	\N	0	\N	2026-06-03 11:04:27.148	2026-06-03 11:04:27.157
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: expiry_alert_trackers expiry_alert_trackers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expiry_alert_trackers
    ADD CONSTRAINT expiry_alert_trackers_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: expiry_alert_trackers_assetId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "expiry_alert_trackers_assetId_key" ON public.expiry_alert_trackers USING btree ("assetId");


--
-- Name: expiry_alert_trackers_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "expiry_alert_trackers_customerId_idx" ON public.expiry_alert_trackers USING btree ("customerId");


--
-- Name: expiry_alert_trackers_expirationDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "expiry_alert_trackers_expirationDate_idx" ON public.expiry_alert_trackers USING btree ("expirationDate");


--
-- Name: notification_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_logs_action_idx ON public.notification_logs USING btree (action);


--
-- Name: notification_logs_notificationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notification_logs_notificationId_idx" ON public.notification_logs USING btree ("notificationId");


--
-- Name: notification_templates_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_templates_channel_idx ON public.notification_templates USING btree (channel);


--
-- Name: notification_templates_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notification_templates_code_key ON public.notification_templates USING btree (code);


--
-- Name: notification_templates_eventType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notification_templates_eventType_idx" ON public.notification_templates USING btree ("eventType");


--
-- Name: notifications_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_category_idx ON public.notifications USING btree (category);


--
-- Name: notifications_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_channel_idx ON public.notifications USING btree (channel);


--
-- Name: notifications_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_customerId_idx" ON public.notifications USING btree ("customerId");


--
-- Name: notifications_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_status_idx ON public.notifications USING btree (status);


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: notification_logs notification_logs_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT "notification_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public.notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.notification_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict pnUhLILFCMfv9elOwMqH2lzneIUz49bsLme01UIxCyuM6gsiu7mAvQTwIj1Bkpn

