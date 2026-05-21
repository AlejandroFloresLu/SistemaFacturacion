--
-- PostgreSQL database dump
--

\restrict oLTD2QXDP7HrpxapN26HtIUKanFhiPJ9YURwQ69ByMrmzdERGeLFhdn5LS4C67B

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id_cliente integer NOT NULL,
    ruc_o_cedula character varying(20) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    ultima_compra character varying(50),
    estado boolean DEFAULT true
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_cliente_seq OWNER TO postgres;

--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_cliente_seq OWNED BY public.clientes.id_cliente;


--
-- Name: factura_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factura_detalles (
    id_detalle integer NOT NULL,
    id_factura integer NOT NULL,
    codigo_producto character varying(50) NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    iva numeric(10,2) DEFAULT 0.00 NOT NULL,
    cantidad_iva numeric(10,2) DEFAULT 0.00 NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    total_producto numeric(10,2) NOT NULL,
    CONSTRAINT chk_cantidad_positiva CHECK ((cantidad > 0))
);


ALTER TABLE public.factura_detalles OWNER TO postgres;

--
-- Name: factura_detalles_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.factura_detalles_id_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.factura_detalles_id_detalle_seq OWNER TO postgres;

--
-- Name: factura_detalles_id_detalle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.factura_detalles_id_detalle_seq OWNED BY public.factura_detalles.id_detalle;


--
-- Name: factura_pagos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factura_pagos (
    id_pago integer NOT NULL,
    id_factura integer NOT NULL,
    id_metodo integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    referencia character varying(100),
    CONSTRAINT factura_pagos_monto_check CHECK ((monto > (0)::numeric))
);


ALTER TABLE public.factura_pagos OWNER TO postgres;

--
-- Name: factura_pagos_id_pago_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.factura_pagos_id_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.factura_pagos_id_pago_seq OWNER TO postgres;

--
-- Name: factura_pagos_id_pago_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.factura_pagos_id_pago_seq OWNED BY public.factura_pagos.id_pago;


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facturas (
    id_factura integer NOT NULL,
    codigo_factura character varying(50) NOT NULL,
    id_cliente integer NOT NULL,
    id_empresa integer DEFAULT 1,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'aprobado'::character varying NOT NULL,
    iva_total numeric(10,2) DEFAULT 0.00 NOT NULL,
    total numeric(10,2) NOT NULL
);


ALTER TABLE public.facturas OWNER TO postgres;

--
-- Name: facturas_id_factura_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.facturas_id_factura_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.facturas_id_factura_seq OWNER TO postgres;

--
-- Name: facturas_id_factura_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.facturas_id_factura_seq OWNED BY public.facturas.id_factura;


--
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metodos_pago (
    id_metodo integer NOT NULL,
    nombre character varying(60) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.metodos_pago OWNER TO postgres;

--
-- Name: metodos_pago_id_metodo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metodos_pago_id_metodo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metodos_pago_id_metodo_seq OWNER TO postgres;

--
-- Name: metodos_pago_id_metodo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metodos_pago_id_metodo_seq OWNED BY public.metodos_pago.id_metodo;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id_producto integer NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion text NOT NULL,
    precio numeric(10,2) NOT NULL,
    estado boolean DEFAULT true
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- Name: productos_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_producto_seq OWNER TO postgres;

--
-- Name: productos_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_producto_seq OWNED BY public.productos.id_producto;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    nombre_rol character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO postgres;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    id_rol integer NOT NULL,
    estado boolean DEFAULT true
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- Name: clientes id_cliente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id_cliente SET DEFAULT nextval('public.clientes_id_cliente_seq'::regclass);


--
-- Name: factura_detalles id_detalle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles ALTER COLUMN id_detalle SET DEFAULT nextval('public.factura_detalles_id_detalle_seq'::regclass);


--
-- Name: factura_pagos id_pago; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_pagos ALTER COLUMN id_pago SET DEFAULT nextval('public.factura_pagos_id_pago_seq'::regclass);


--
-- Name: facturas id_factura; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas ALTER COLUMN id_factura SET DEFAULT nextval('public.facturas_id_factura_seq'::regclass);


--
-- Name: metodos_pago id_metodo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago ALTER COLUMN id_metodo SET DEFAULT nextval('public.metodos_pago_id_metodo_seq'::regclass);


--
-- Name: productos id_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id_producto SET DEFAULT nextval('public.productos_id_producto_seq'::regclass);


--
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id_cliente, ruc_o_cedula, nombres, apellidos, telefono, email, ultima_compra, estado) FROM stdin;
1	1712345678	Juan Carlos	P�rez Mora	+593 987654321	jcperez@example.com	Nuevo	t
2	1726874926	Alejandro	Flores	\N	asfloresl@puce.edu.ec	Nuevo	t
3	1753487063	Gabriel	Aguinaga	+593 0983402215	jkandarina@gmail.com	2026-05-18	t
9	1722418520001	Alejandro	Flores	+593 9999999999	asfloresl@puce.edu.ec	Nuevo	t
10	1722459850	pan	con queso	+593 333222444	asfloresl@puce.edu.ec	Nuevo	t
11	1752693620	Ariel	Chacha	+593 0994390092	guagyagayw@gmail.com	2026-05-19	f
7	1715678114	Patricia	Lugmaña	+593 0989390813	asfloresl@puce.edu.ec	2026-05-19	t
18	1752693661	Ariel	Chacha	+593 099439002	laextrano@gmail.com	2026-05-19	t
\.


--
-- Data for Name: factura_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factura_detalles (id_detalle, id_factura, codigo_producto, cantidad, precio_unitario, iva, cantidad_iva, subtotal, total_producto) FROM stdin;
1	1	VUE-001	1	678.98	15.00	101.85	678.98	780.83
6	6	547	1	98.00	15.00	14.70	98.00	112.70
7	6	VUE-001	1	85.00	15.00	12.75	85.00	97.75
8	7	547	1	98.00	15.00	14.70	98.00	112.70
9	8	VUE-001	1	85.00	15.00	12.75	85.00	97.75
10	9	VUE-001	1	85.00	15.00	12.75	85.00	97.75
11	10	VUE-001	1	85.00	15.00	12.75	85.00	97.75
12	11	547	1	98.00	15.00	14.70	98.00	112.70
13	12	TOU-050	1	1000.00	15.00	150.00	1000.00	1150.00
\.


--
-- Data for Name: factura_pagos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factura_pagos (id_pago, id_factura, id_metodo, monto, referencia) FROM stdin;
3	6	2	110.45	\N
4	6	1	100.00	\N
5	7	1	110.70	\N
6	7	3	2.00	\N
7	8	1	97.75	\N
8	9	1	50.00	\N
9	9	4	47.75	\N
10	10	1	97.75	\N
11	11	1	112.70	\N
12	12	1	1150.00	\N
\.


--
-- Data for Name: facturas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facturas (id_factura, codigo_factura, id_cliente, id_empresa, fecha, estado, iva_total, total) FROM stdin;
1	FAC-000001	3	1	2026-05-18 20:56:41.024636	aprobado	101.85	780.83
6	FAC-000002	7	1	2026-05-18 22:14:00.474103	aprobado	27.45	210.45
7	FAC-000003	7	1	2026-05-19 14:28:21.081557	aprobado	14.70	112.70
8	FAC-000004	7	1	2026-05-19 14:51:25.553727	aprobado	12.75	97.75
9	FAC-000005	11	1	2026-05-19 17:47:30.111579	anulado	12.75	97.75
10	FAC-000006	11	1	2026-05-19 17:49:32.819924	aprobado	12.75	97.75
11	FAC-000007	7	1	2026-05-19 17:58:18.917673	aprobado	14.70	112.70
12	FAC-000008	18	1	2026-05-19 18:01:06.846185	aprobado	150.00	1150.00
\.


--
-- Data for Name: metodos_pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metodos_pago (id_metodo, nombre, activo) FROM stdin;
1	Efectivo	t
2	Tarjeta de Crédito	t
3	Tarjeta de Débito	t
4	Transferencia Bancaria	t
5	Cheque	t
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id_producto, codigo, descripcion, precio, estado) FROM stdin;
1	VUE-001	Boleto A�reo Quito-Guayaquil	85.00	t
2	547	6513	98.00	t
6	TOU-001	iu	442.00	f
7	TOU-050	ALETEEXTRANO	1000.00	t
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, nombre_rol, descripcion) FROM stdin;
1	Administrador	Acceso total al sistema
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, username, password_hash, id_rol, estado) FROM stdin;
1	admin	$2b$10$CsBSkOEm9WrmwP1ASBYMyeSdiwd4HqS3EnR34pLg4K60qiyTZchb.	1	t
\.


--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_cliente_seq', 18, true);


--
-- Name: factura_detalles_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.factura_detalles_id_detalle_seq', 13, true);


--
-- Name: factura_pagos_id_pago_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.factura_pagos_id_pago_seq', 12, true);


--
-- Name: facturas_id_factura_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.facturas_id_factura_seq', 12, true);


--
-- Name: metodos_pago_id_metodo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metodos_pago_id_metodo_seq', 5, true);


--
-- Name: productos_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_producto_seq', 7, true);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 1, true);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 1, true);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente);


--
-- Name: clientes clientes_ruc_o_cedula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_ruc_o_cedula_key UNIQUE (ruc_o_cedula);


--
-- Name: factura_detalles factura_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT factura_detalles_pkey PRIMARY KEY (id_detalle);


--
-- Name: factura_pagos factura_pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_pagos
    ADD CONSTRAINT factura_pagos_pkey PRIMARY KEY (id_pago);


--
-- Name: facturas facturas_codigo_factura_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_codigo_factura_key UNIQUE (codigo_factura);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id_factura);


--
-- Name: metodos_pago metodos_pago_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_nombre_key UNIQUE (nombre);


--
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id_metodo);


--
-- Name: productos productos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_key UNIQUE (codigo);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id_producto);


--
-- Name: roles roles_nombre_rol_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_rol_key UNIQUE (nombre_rol);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: idx_clientes_ruc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clientes_ruc ON public.clientes USING btree (ruc_o_cedula);


--
-- Name: idx_factura_pagos_factura; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_factura_pagos_factura ON public.factura_pagos USING btree (id_factura);


--
-- Name: idx_facturas_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facturas_codigo ON public.facturas USING btree (codigo_factura);


--
-- Name: idx_productos_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_codigo ON public.productos USING btree (codigo);


--
-- Name: factura_detalles fk_detalles_facturas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT fk_detalles_facturas FOREIGN KEY (id_factura) REFERENCES public.facturas(id_factura) ON DELETE CASCADE;


--
-- Name: factura_detalles fk_detalles_productos; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT fk_detalles_productos FOREIGN KEY (codigo_producto) REFERENCES public.productos(codigo) ON DELETE RESTRICT;


--
-- Name: facturas fk_facturas_clientes; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT fk_facturas_clientes FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE RESTRICT;


--
-- Name: factura_pagos fk_fp_factura; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_pagos
    ADD CONSTRAINT fk_fp_factura FOREIGN KEY (id_factura) REFERENCES public.facturas(id_factura) ON DELETE CASCADE;


--
-- Name: factura_pagos fk_fp_metodo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_pagos
    ADD CONSTRAINT fk_fp_metodo FOREIGN KEY (id_metodo) REFERENCES public.metodos_pago(id_metodo) ON DELETE RESTRICT;


--
-- Name: usuarios fk_usuarios_roles; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict oLTD2QXDP7HrpxapN26HtIUKanFhiPJ9YURwQ69ByMrmzdERGeLFhdn5LS4C67B

