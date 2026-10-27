--
-- PostgreSQL database dump
--

\restrict FirWbRSsvdBvne3zLJOJ7PbEeoJmGBU0r9NJApTOODLJD7Z6oQXxvAoDDMKqj1b

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: maintenance_audits_fromstatus_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_audits_fromstatus_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenance_audits_tostatus_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_audits_tostatus_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_status_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: maintenances_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenances_type_enum AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE'
);


--
-- Name: mechanics_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mechanics_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'TECHNICIAN'
);


--
-- Name: vehicles_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vehicles_status_enum AS ENUM (
    'AVAILABLE',
    'IN_MAINTENANCE',
    'INACTIVE'
);


--
-- Name: workshops_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workshops_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenance_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_audits (
    id integer NOT NULL,
    "maintenanceId" integer NOT NULL,
    "fromStatus" public.maintenance_audits_fromstatus_enum,
    "toStatus" public.maintenance_audits_tostatus_enum NOT NULL,
    "changedById" integer NOT NULL,
    "changedByEmail" character varying(150) NOT NULL,
    "changedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenance_audits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenance_audits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenance_audits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenance_audits_id_seq OWNED BY public.maintenance_audits.id;


--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenances (
    id integer NOT NULL,
    type public.maintenances_type_enum NOT NULL,
    description text NOT NULL,
    mileage integer NOT NULL,
    "scheduledDate" timestamp with time zone NOT NULL,
    "scheduledEndDate" timestamp with time zone NOT NULL,
    status public.maintenances_status_enum DEFAULT 'SCHEDULED'::public.maintenances_status_enum NOT NULL,
    "workDone" text,
    "finalCost" numeric(12,2),
    "finishedAt" timestamp with time zone,
    "finalMileage" integer,
    "vehicleId" integer NOT NULL,
    "mechanicId" integer NOT NULL,
    "workshopId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.maintenances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: maintenances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.maintenances_id_seq OWNED BY public.maintenances.id;


--
-- Name: mechanics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mechanics (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    specialty character varying(100) NOT NULL,
    status public.mechanics_status_enum DEFAULT 'ACTIVE'::public.mechanics_status_enum NOT NULL,
    "userId" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mechanics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mechanics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mechanics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mechanics_id_seq OWNED BY public.mechanics.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying NOT NULL,
    role public.users_role_enum DEFAULT 'TECHNICIAN'::public.users_role_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    plate character varying(15) NOT NULL,
    brand character varying(60) NOT NULL,
    model character varying(60) NOT NULL,
    year integer NOT NULL,
    mileage integer NOT NULL,
    status public.vehicles_status_enum DEFAULT 'AVAILABLE'::public.vehicles_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: workshops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshops (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address character varying(200) NOT NULL,
    status public.workshops_status_enum DEFAULT 'ACTIVE'::public.workshops_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: workshops_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workshops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workshops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workshops_id_seq OWNED BY public.workshops.id;


--
-- Name: maintenance_audits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_audits ALTER COLUMN id SET DEFAULT nextval('public.maintenance_audits_id_seq'::regclass);


--
-- Name: maintenances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances ALTER COLUMN id SET DEFAULT nextval('public.maintenances_id_seq'::regclass);


--
-- Name: mechanics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics ALTER COLUMN id SET DEFAULT nextval('public.mechanics_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Name: workshops id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops ALTER COLUMN id SET DEFAULT nextval('public.workshops_id_seq'::regclass);


--
-- Data for Name: maintenance_audits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_audits (id, "maintenanceId", "fromStatus", "toStatus", "changedById", "changedByEmail", "changedAt") FROM stdin;
1	1	\N	SCHEDULED	1	admin@fleetcore.com	2026-10-27 14:44:06.700641
2	1	SCHEDULED	IN_PROGRESS	1	admin@fleetcore.com	2026-10-27 14:44:06.710269
3	1	IN_PROGRESS	COMPLETED	1	admin@fleetcore.com	2026-10-27 14:44:06.717493
4	2	\N	SCHEDULED	1	admin@fleetcore.com	2026-10-27 14:44:06.724343
5	2	SCHEDULED	IN_PROGRESS	1	admin@fleetcore.com	2026-10-27 14:44:06.731077
\.


--
-- Data for Name: maintenances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenances (id, type, description, mileage, "scheduledDate", "scheduledEndDate", status, "workDone", "finalCost", "finishedAt", "finalMileage", "vehicleId", "mechanicId", "workshopId", "createdAt") FROM stdin;
1	PREVENTIVE	Cambio de aceite y filtros	45000	2026-10-24 14:44:06.7+00	2026-10-24 16:14:06.7+00	COMPLETED	Cambio de aceite y filtros	350000.00	2026-10-24 16:44:06.717+00	45010	1	2	1	2026-10-27 14:44:06.700641
2	CORRECTIVE	Reemplazo de pastillas de freno	80000	2026-10-27 13:44:06.724+00	2026-10-27 17:44:06.724+00	IN_PROGRESS	\N	\N	\N	\N	3	1	1	2026-10-27 14:44:06.724343
\.


--
-- Data for Name: mechanics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mechanics (id, name, email, specialty, status, "userId", "createdAt") FROM stdin;
1	Carlos Pérez	carlos@fleetcore.com	Frenos y suspensión	ACTIVE	2	2026-10-27 14:44:06.669271
2	Laura Gómez	laura@fleetcore.com	Motor y transmisión	ACTIVE	3	2026-10-27 14:44:06.673476
3	Andrés Ruiz	andres@fleetcore.com	Electricidad	INACTIVE	\N	2026-10-27 14:44:06.675576
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, "createdAt") FROM stdin;
1	Admin FleetCore	admin@fleetcore.com	$2b$10$uGemCn5C6w7CZv1gPPnqROK00n7f7iDHvFnbFmm2yrD/0gnVDmXLG	ADMIN	2026-10-27 14:44:06.52753
2	Técnico Uno	tecnico1@fleetcore.com	$2b$10$BYy8wj97mj7z3Wead/0XfuOeZHjEtwyf5Ybt0fswtNkOH4290.K/K	TECHNICIAN	2026-10-27 14:44:06.596719
3	Técnico Dos	tecnico2@fleetcore.com	$2b$10$u3tAoOgTrTqSm.Q/PlyyEuCz3QN4LLe7QNeYHoZKYcNvDW9Z3o7wW	TECHNICIAN	2026-10-27 14:44:06.661007
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, plate, brand, model, year, mileage, status, "createdAt") FROM stdin;
2	DEF456	Hino	300	2021	62000	AVAILABLE	2026-10-27 14:44:06.692054
1	ABC123	Chevrolet	NPR	2022	45010	AVAILABLE	2026-10-27 14:44:06.689299
3	GHI789	Isuzu	NKR	2020	80000	IN_MAINTENANCE	2026-10-27 14:44:06.6943
4	JKL012	Foton	Aumark	2018	150000	INACTIVE	2026-10-27 14:44:06.696618
\.


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workshops (id, name, address, status, "createdAt") FROM stdin;
1	Taller Norte	Calle 80 # 45-12, Bogotá	ACTIVE	2026-10-27 14:44:06.682155
2	Taller Sur	Carrera 30 # 10-05, Bogotá	INACTIVE	2026-10-27 14:44:06.683841
\.


--
-- Name: maintenance_audits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenance_audits_id_seq', 5, true);


--
-- Name: maintenances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.maintenances_id_seq', 2, true);


--
-- Name: mechanics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mechanics_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 4, true);


--
-- Name: workshops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workshops_id_seq', 2, true);


--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: mechanics PK_2c0ed23afc0cc7ff361c17e53df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "PK_2c0ed23afc0cc7ff361c17e53df" PRIMARY KEY (id);


--
-- Name: maintenances PK_62403473bd524a42d58589aa78b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY (id);


--
-- Name: workshops PK_6d0e82a124f5b53df91c8989848; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: maintenance_audits PK_ec90a205dc2d9bad88771eeaf45; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_audits
    ADD CONSTRAINT "PK_ec90a205dc2d9bad88771eeaf45" PRIMARY KEY (id);


--
-- Name: mechanics UQ_301c3b5fa2d49aab65dcfda36a6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "UQ_301c3b5fa2d49aab65dcfda36a6" UNIQUE (email);


--
-- Name: mechanics UQ_85c0da75e5dedc5eca00055cfbe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "UQ_85c0da75e5dedc5eca00055cfbe" UNIQUE ("userId");


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: vehicles UQ_ec7181ebdab798d97070122a5bf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE (plate);


--
-- Name: maintenances FK_3a9ba7c05e1ffba00560d11f364; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364" FOREIGN KEY ("mechanicId") REFERENCES public.mechanics(id);


--
-- Name: maintenances FK_75331cd2a0f0c22bcb2fc4f6d6a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a" FOREIGN KEY ("workshopId") REFERENCES public.workshops(id);


--
-- Name: mechanics FK_85c0da75e5dedc5eca00055cfbe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "FK_85c0da75e5dedc5eca00055cfbe" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: maintenance_audits FK_b80ae52a00e880351f5b93b42bf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_audits
    ADD CONSTRAINT "FK_b80ae52a00e880351f5b93b42bf" FOREIGN KEY ("maintenanceId") REFERENCES public.maintenances(id);


--
-- Name: maintenances FK_daa193fdfccde41a2ed4de8a474; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FirWbRSsvdBvne3zLJOJ7PbEeoJmGBU0r9NJApTOODLJD7Z6oQXxvAoDDMKqj1b

