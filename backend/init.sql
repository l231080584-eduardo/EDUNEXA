/* EDUNEXA bootstrap for SQL Server. Safe to execute at every backend start. */
IF DB_ID(N'ENUDEXA_DB') IS NULL
BEGIN
    EXEC(N'CREATE DATABASE [ENUDEXA_DB]');
END;
GO

USE [ENUDEXA_DB];
GO

/* Migrate the initial prototype schema only when it is empty of student data. */
IF OBJECT_ID(N'dbo.carreras', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM sys.columns c
       WHERE c.object_id = OBJECT_ID(N'dbo.carreras')
         AND c.name = N'id'
         AND TYPE_NAME(c.system_type_id) <> N'uniqueidentifier'
   )
BEGIN
    IF OBJECT_ID(N'dbo.usuarios', N'U') IS NOT NULL
        EXEC(N'IF EXISTS (SELECT 1 FROM dbo.usuarios) BEGIN ;THROW 51000, ''La migración de carreras requiere respaldo porque ya hay usuarios.'', 1; END;');
    IF OBJECT_ID(N'dbo.resultados_test', N'U') IS NOT NULL
        EXEC(N'IF EXISTS (SELECT 1 FROM dbo.resultados_test) BEGIN ;THROW 51000, ''La migración de resultados requiere respaldo porque ya hay evaluaciones.'', 1; END;');

    IF OBJECT_ID(N'dbo.resultado_universidades', N'U') IS NOT NULL DROP TABLE dbo.resultado_universidades;
    IF OBJECT_ID(N'dbo.resultado_carreras', N'U') IS NOT NULL DROP TABLE dbo.resultado_carreras;
    IF OBJECT_ID(N'dbo.universidad_carrera', N'U') IS NOT NULL DROP TABLE dbo.universidad_carrera;
    IF OBJECT_ID(N'dbo.campos_laborales', N'U') IS NOT NULL DROP TABLE dbo.campos_laborales;
    IF OBJECT_ID(N'dbo.perfiles_egreso', N'U') IS NOT NULL DROP TABLE dbo.perfiles_egreso;
    IF OBJECT_ID(N'dbo.resultados_test', N'U') IS NOT NULL DROP TABLE dbo.resultados_test;
    IF OBJECT_ID(N'dbo.universidades', N'U') IS NOT NULL DROP TABLE dbo.universidades;
    DROP TABLE dbo.carreras;
END;
GO

/* Keep the pre-existing user table data while aligning its columns with JPA. */
IF OBJECT_ID(N'dbo.usuarios', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM sys.columns c
       WHERE c.object_id = OBJECT_ID(N'dbo.usuarios')
         AND c.name = N'email'
         AND c.max_length > 510
   )
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.usuarios WHERE LEN(email) > 255)
    BEGIN
        ;THROW 51001, 'Hay correos mayores a 255 caracteres; revisa el esquema antes de migrar.', 1;
    END;
    IF OBJECT_ID(N'dbo.UQ_usuarios_email', N'UQ') IS NOT NULL
        ALTER TABLE dbo.usuarios DROP CONSTRAINT UQ_usuarios_email;
    ALTER TABLE dbo.usuarios ALTER COLUMN email NVARCHAR(255) NOT NULL;
    ALTER TABLE dbo.usuarios ADD CONSTRAINT UQ_usuarios_email UNIQUE (email);
END;
GO

IF OBJECT_ID(N'dbo.usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuarios (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_usuarios PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL CONSTRAINT UQ_usuarios_email UNIQUE,
        nombre NVARCHAR(255) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        fecha_registro DATETIME2 NOT NULL CONSTRAINT DF_usuarios_fecha DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.carreras', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.carreras (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_carreras PRIMARY KEY DEFAULT NEWID(),
        nombre NVARCHAR(500) NOT NULL CONSTRAINT UQ_carreras_nombre UNIQUE,
        area NVARCHAR(255) NOT NULL,
        duracion_semestres INT NULL,
        descripcion NVARCHAR(4000) NULL,
        peso_intereses FLOAT NULL,
        peso_materias FLOAT NULL,
        peso_estilo_vida FLOAT NULL,
        peso_geolocalizacion FLOAT NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.universidades', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.universidades (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_universidades PRIMARY KEY DEFAULT NEWID(),
        nombre NVARCHAR(1000) NOT NULL CONSTRAINT UQ_universidades_nombre UNIQUE,
        tipo NVARCHAR(255) NULL,
        latitud FLOAT NULL,
        longitud FLOAT NULL,
        direccion NVARCHAR(1000) NULL,
        sitio_web NVARCHAR(1000) NULL,
        es_tecnm_iztapalapa1 BIT NOT NULL CONSTRAINT DF_universidad_tecnm DEFAULT 0,
        estado NVARCHAR(100) NULL,
        municipio NVARCHAR(120) NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.resultados_test', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.resultados_test (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_resultados_test PRIMARY KEY,
        fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_resultado_creacion DEFAULT SYSUTCDATETIME(),
        puntaje_general FLOAT NULL,
        carrera_sugerida NVARCHAR(255) NULL,
        fecha_evaluacion DATETIME2 NOT NULL CONSTRAINT DF_resultado_evaluacion DEFAULT SYSUTCDATETIME(),
        vector_respuestas NVARCHAR(MAX) NULL,
        top_carreras_json NVARCHAR(MAX) NULL,
        reporte_ia NVARCHAR(MAX) NULL,
        puntaje_match FLOAT NULL,
        usuario_id UNIQUEIDENTIFIER NULL,
        perfil NVARCHAR(120) NULL,
        puntuacion INT NOT NULL CONSTRAINT DF_resultado_puntuacion DEFAULT 0,
        xp INT NOT NULL CONSTRAINT DF_resultado_xp DEFAULT 0,
        gem_counts_json NVARCHAR(MAX) NULL,
        CONSTRAINT FK_resultados_usuario FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.perfiles_egreso', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.perfiles_egreso (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_perfiles_egreso PRIMARY KEY DEFAULT NEWID(),
        resumen_competencias NVARCHAR(4000) NOT NULL,
        conocimientos_tecnicos NVARCHAR(4000) NULL,
        habilidades_blandas NVARCHAR(4000) NULL,
        carrera_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT UQ_perfil_carrera UNIQUE,
        descripcion NVARCHAR(4000) NULL,
        habilidades NVARCHAR(MAX) NULL,
        CONSTRAINT FK_perfil_carrera FOREIGN KEY (carrera_id) REFERENCES dbo.carreras(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.campos_laborales', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.campos_laborales (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_campos_laborales PRIMARY KEY DEFAULT NEWID(),
        puesto_trabajo NVARCHAR(500) NOT NULL,
        sector_empresarial NVARCHAR(255) NULL,
        salario_promedio_estimado FLOAT NULL,
        nivel_empleabilidad NVARCHAR(255) NULL,
        carrera_id UNIQUEIDENTIFIER NULL,
        puesto NVARCHAR(500) NULL,
        sector NVARCHAR(500) NULL,
        CONSTRAINT FK_campos_carrera FOREIGN KEY (carrera_id) REFERENCES dbo.carreras(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.universidad_carrera', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.universidad_carrera (
        universidad_id UNIQUEIDENTIFIER NOT NULL,
        carrera_id UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_universidad_carrera PRIMARY KEY (universidad_id, carrera_id),
        CONSTRAINT FK_uc_universidad FOREIGN KEY (universidad_id) REFERENCES dbo.universidades(id),
        CONSTRAINT FK_uc_carrera FOREIGN KEY (carrera_id) REFERENCES dbo.carreras(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.resultado_carreras', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.resultado_carreras (
        resultado_id BIGINT NOT NULL,
        carrera_id UNIQUEIDENTIFIER NOT NULL,
        prioridad TINYINT NOT NULL,
        CONSTRAINT PK_resultado_carreras PRIMARY KEY (resultado_id, carrera_id),
        CONSTRAINT FK_resultado_carrera_resultado FOREIGN KEY (resultado_id) REFERENCES dbo.resultados_test(id) ON DELETE CASCADE,
        CONSTRAINT FK_resultado_carrera_carrera FOREIGN KEY (carrera_id) REFERENCES dbo.carreras(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.resultado_universidades', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.resultado_universidades (
        resultado_id BIGINT NOT NULL,
        universidad_id UNIQUEIDENTIFIER NOT NULL,
        prioridad TINYINT NOT NULL,
        CONSTRAINT PK_resultado_universidades PRIMARY KEY (resultado_id, universidad_id),
        CONSTRAINT FK_resultado_universidad_resultado FOREIGN KEY (resultado_id) REFERENCES dbo.resultados_test(id) ON DELETE CASCADE,
        CONSTRAINT FK_resultado_universidad_universidad FOREIGN KEY (universidad_id) REFERENCES dbo.universidades(id)
    );
END;
GO

/* Seed career UUIDs are stable so university-to-career links remain repeatable. */
INSERT INTO dbo.carreras (id, nombre, area, duracion_semestres, descripcion)
SELECT seed.id, seed.nombre, seed.area, seed.duracion, seed.descripcion
FROM (VALUES
    (CAST('10000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), N'Ingeniería en Sistemas Computacionales', N'Tecnología', 9, N'Diseño y desarrollo de software, redes y soluciones digitales.'),
    (CAST('10000000-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER), N'Ingeniería en Ciencia de Datos', N'Tecnología', 9, N'Análisis de datos, inteligencia artificial y modelos predictivos.'),
    (CAST('10000000-0000-0000-0000-000000000003' AS UNIQUEIDENTIFIER), N'Ingeniería Mecatrónica', N'Ingeniería', 9, N'Integración de mecánica, electrónica, control y programación.'),
    (CAST('10000000-0000-0000-0000-000000000004' AS UNIQUEIDENTIFIER), N'Diseño Digital y Experiencias Interactivas', N'Diseño', 8, N'Diseño de interfaces, productos digitales y experiencias interactivas.'),
    (CAST('10000000-0000-0000-0000-000000000005' AS UNIQUEIDENTIFIER), N'Administración e Innovación Empresarial', N'Negocios', 8, N'Gestión de organizaciones, operaciones, finanzas e innovación.'),
    (CAST('10000000-0000-0000-0000-000000000006' AS UNIQUEIDENTIFIER), N'Ingeniería en Biotecnología', N'Ciencias de la Salud', 9, N'Aplicación de biología y tecnología a salud, alimentos y ambiente.')
) AS seed(id, nombre, area, duracion, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM dbo.carreras c WHERE c.id = seed.id);
GO

INSERT INTO dbo.universidades (id, nombre, tipo, latitud, longitud, direccion, sitio_web, es_tecnm_iztapalapa1, estado, municipio)
SELECT seed.id, seed.nombre, seed.tipo, seed.latitud, seed.longitud, seed.direccion, seed.web, seed.es_tecnm, seed.estado, seed.municipio
FROM (VALUES
    (CAST('20000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), N'TecNM Plantel Iztapalapa 1', N'Instituto Tecnológico', 19.3562, -99.0141, N'Iztapalapa, Ciudad de México', N'https://iztapalapa1.tecnm.mx/', CAST(1 AS BIT), N'Ciudad de México', N'Iztapalapa'),
    (CAST('20000000-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER), N'Universidad Nacional Autónoma de México', N'Universidad pública', 19.3320, -99.1880, N'Coyoacán, Ciudad de México', N'https://www.unam.mx/', CAST(0 AS BIT), N'Ciudad de México', N'Coyoacán'),
    (CAST('20000000-0000-0000-0000-000000000003' AS UNIQUEIDENTIFIER), N'Instituto Politécnico Nacional - Zacatenco', N'Universidad pública', 19.5040, -99.1460, N'Gustavo A. Madero, Ciudad de México', N'https://www.ipn.mx/', CAST(0 AS BIT), N'Ciudad de México', N'Gustavo A. Madero'),
    (CAST('20000000-0000-0000-0000-000000000004' AS UNIQUEIDENTIFIER), N'Universidad Autónoma Metropolitana - Iztapalapa', N'Universidad pública', 19.3600, -99.0730, N'Iztapalapa, Ciudad de México', N'https://www.izt.uam.mx/', CAST(0 AS BIT), N'Ciudad de México', N'Iztapalapa'),
    (CAST('20000000-0000-0000-0000-000000000005' AS UNIQUEIDENTIFIER), N'Universidad Autónoma del Estado de México - Texcoco', N'Universidad pública', 19.5110, -98.8820, N'Texcoco, Estado de México', N'https://www.uaemex.mx/', CAST(0 AS BIT), N'Estado de México', N'Texcoco')
) AS seed(id, nombre, tipo, latitud, longitud, direccion, web, es_tecnm, estado, municipio)
WHERE NOT EXISTS (SELECT 1 FROM dbo.universidades u WHERE u.id = seed.id);
GO

INSERT INTO dbo.perfiles_egreso (id, resumen_competencias, conocimientos_tecnicos, habilidades_blandas, carrera_id, descripcion, habilidades)
SELECT seed.id, seed.resumen, seed.tecnicos, seed.blandas, c.id, seed.resumen, seed.tecnicos
FROM (VALUES
    (CAST('30000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER), N'Construye, prueba y mantiene sistemas de software y servicios de red.', N'Programación, bases de datos, arquitectura de software, redes y ciberseguridad.', N'Pensamiento lógico, colaboración y aprendizaje continuo.', N'Ingeniería en Sistemas Computacionales'),
    (CAST('30000000-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER), N'Transforma datos en modelos, productos y decisiones medibles.', N'Estadística, Python, aprendizaje automático, visualización e ingeniería de datos.', N'Pensamiento analítico, comunicación y criterio ético.', N'Ingeniería en Ciencia de Datos'),
    (CAST('30000000-0000-0000-0000-000000000003' AS UNIQUEIDENTIFIER), N'Diseña sistemas automatizados que integran componentes mecánicos y electrónicos.', N'Control, electrónica, robótica, CAD y programación embebida.', N'Resolución de problemas, trabajo interdisciplinario y precisión.', N'Ingeniería Mecatrónica'),
    (CAST('30000000-0000-0000-0000-000000000004' AS UNIQUEIDENTIFIER), N'Investiga necesidades y diseña productos digitales accesibles y útiles.', N'UX/UI, prototipado, diseño visual, investigación de usuarios y accesibilidad.', N'Empatía, creatividad, comunicación y pensamiento crítico.', N'Diseño Digital y Experiencias Interactivas'),
    (CAST('30000000-0000-0000-0000-000000000005' AS UNIQUEIDENTIFIER), N'Coordina operaciones y desarrolla propuestas de valor sostenibles.', N'Finanzas, análisis de procesos, estrategia y gestión de proyectos.', N'Liderazgo, negociación, organización y toma de decisiones.', N'Administración e Innovación Empresarial'),
    (CAST('30000000-0000-0000-0000-000000000006' AS UNIQUEIDENTIFIER), N'Desarrolla procesos biológicos aplicados a salud, industria y ambiente.', N'Biología molecular, laboratorio, bioinformática, calidad y bioprocesos.', N'Rigor, colaboración, responsabilidad y pensamiento científico.', N'Ingeniería en Biotecnología')
) AS seed(id, resumen, tecnicos, blandas, carrera)
JOIN dbo.carreras c ON c.nombre = seed.carrera
WHERE NOT EXISTS (SELECT 1 FROM dbo.perfiles_egreso p WHERE p.carrera_id = c.id);
GO

INSERT INTO dbo.campos_laborales (id, puesto_trabajo, sector_empresarial, salario_promedio_estimado, nivel_empleabilidad, carrera_id, puesto, sector)
SELECT NEWID(), seed.puesto, seed.sector, seed.salario, N'Alta', c.id, seed.puesto, seed.sector
FROM (VALUES
    (N'Ingeniería en Sistemas Computacionales', N'Desarrollador de software', N'Tecnología y servicios digitales', 32000.0),
    (N'Ingeniería en Sistemas Computacionales', N'Especialista en ciberseguridad', N'Tecnología y servicios financieros', 38000.0),
    (N'Ingeniería en Ciencia de Datos', N'Analista de datos', N'Finanzas, comercio y tecnología', 30000.0),
    (N'Ingeniería en Ciencia de Datos', N'Científico de datos', N'Tecnología, salud e industria', 42000.0),
    (N'Ingeniería Mecatrónica', N'Ingeniero de automatización', N'Manufactura y robótica', 28000.0),
    (N'Ingeniería Mecatrónica', N'Integrador de sistemas robóticos', N'Automotriz e industria', 32000.0),
    (N'Diseño Digital y Experiencias Interactivas', N'Diseñador UX/UI', N'Tecnología y comercio digital', 28000.0),
    (N'Diseño Digital y Experiencias Interactivas', N'Diseñador de producto digital', N'Consultoría y servicios digitales', 30000.0),
    (N'Administración e Innovación Empresarial', N'Analista de operaciones', N'Logística y servicios', 25000.0),
    (N'Administración e Innovación Empresarial', N'Consultor de procesos', N'Consultoría y sector empresarial', 32000.0),
    (N'Ingeniería en Biotecnología', N'Analista de laboratorio', N'Salud y farmacéutica', 22000.0),
    (N'Ingeniería en Biotecnología', N'Especialista en bioprocesos', N'Alimentos y biotecnología', 27000.0)
) AS seed(carrera, puesto, sector, salario)
JOIN dbo.carreras c ON c.nombre = seed.carrera
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.campos_laborales l WHERE l.carrera_id = c.id AND l.puesto_trabajo = seed.puesto
);
GO

/* Career catalog matching the starter institutions' programs. */
INSERT INTO dbo.universidad_carrera (universidad_id, carrera_id)
SELECT u.id, c.id
FROM (VALUES
    (N'TecNM Plantel Iztapalapa 1', N'Ingeniería en Sistemas Computacionales'),
    (N'TecNM Plantel Iztapalapa 1', N'Ingeniería Mecatrónica'),
    (N'Universidad Nacional Autónoma de México', N'Ingeniería en Sistemas Computacionales'),
    (N'Universidad Nacional Autónoma de México', N'Ingeniería en Ciencia de Datos'),
    (N'Universidad Nacional Autónoma de México', N'Diseño Digital y Experiencias Interactivas'),
    (N'Universidad Nacional Autónoma de México', N'Ingeniería en Biotecnología'),
    (N'Instituto Politécnico Nacional - Zacatenco', N'Ingeniería en Sistemas Computacionales'),
    (N'Instituto Politécnico Nacional - Zacatenco', N'Ingeniería en Ciencia de Datos'),
    (N'Instituto Politécnico Nacional - Zacatenco', N'Ingeniería Mecatrónica'),
    (N'Universidad Autónoma Metropolitana - Iztapalapa', N'Ingeniería en Sistemas Computacionales'),
    (N'Universidad Autónoma Metropolitana - Iztapalapa', N'Administración e Innovación Empresarial'),
    (N'Universidad Autónoma Metropolitana - Iztapalapa', N'Ingeniería en Biotecnología'),
    (N'Universidad Autónoma del Estado de México - Texcoco', N'Administración e Innovación Empresarial'),
    (N'Universidad Autónoma del Estado de México - Texcoco', N'Ingeniería en Biotecnología')
) AS seed(universidad, carrera)
JOIN dbo.universidades u ON u.nombre = seed.universidad
JOIN dbo.carreras c ON c.nombre = seed.carrera
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.universidad_carrera uc WHERE uc.universidad_id = u.id AND uc.carrera_id = c.id
);
GO
