-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-06-2026 a las 23:45:36
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `transplantchain`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignaciones`
--

CREATE TABLE `asignaciones` (
  `id` int(11) NOT NULL,
  `donanteId` int(11) DEFAULT NULL,
  `receptorId` int(11) DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `organo` varchar(100) DEFAULT NULL,
  `hospitalOrigen` varchar(255) DEFAULT NULL,
  `receptor` varchar(255) DEFAULT NULL,
  `hospitalDestino` varchar(255) DEFAULT NULL,
  `score` float DEFAULT NULL,
  `txHash` varchar(255) DEFAULT NULL,
  `estadoBlockchain` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `donantes`
--

CREATE TABLE `donantes` (
  `id` int(11) NOT NULL,
  `hospitalOrigen` varchar(255) NOT NULL,
  `organo` varchar(100) NOT NULL,
  `grupoSanguineo` varchar(10) NOT NULL,
  `horaExtraccion` datetime NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'Disponible'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `donantes`
--

INSERT INTO `donantes` (`id`, `hospitalOrigen`, `organo`, `grupoSanguineo`, `horaExtraccion`, `estado`) VALUES
(1, 'Hospital Italiano', 'Riñón', 'O+', '2026-06-18 14:15:58', 'Disponible'),
(2, 'Hospital de Clínicas', 'Hígado', 'A-', '2026-06-18 14:15:58', 'Disponible'),
(3, 'Hospital Español', 'Riñón', 'A+', '2026-06-18 14:45:04', 'Disponible');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `receptores`
--

CREATE TABLE `receptores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `organoNecesitado` varchar(100) NOT NULL,
  `grupoSanguineo` varchar(10) NOT NULL,
  `urgencia` int(11) NOT NULL,
  `diasEspera` int(11) NOT NULL,
  `distanciaKm` int(11) NOT NULL,
  `hospital` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `receptores`
--

INSERT INTO `receptores` (`id`, `nombre`, `organoNecesitado`, `grupoSanguineo`, `urgencia`, `diasEspera`, `distanciaKm`, `hospital`) VALUES
(1, 'Paciente A. Gómez', 'Riñón', 'O+', 9, 210, 12, 'Hospital Italiano'),
(2, 'Paciente B. Fernández', 'Riñón', 'A+', 6, 95, 40, 'Hospital Austral'),
(3, 'Paciente C. Rodríguez', 'Riñón', 'O-', 8, 300, 8, 'Hospital Italiano'),
(4, 'Paciente D. Silva', 'Hígado', 'O-', 10, 150, 25, 'Hospital de Clínicas'),
(5, 'Paciente E. Torres', 'Hígado', 'A-', 5, 60, 5, 'Hospital de Clínicas'),
(6, 'Paciente F. Acosta', 'Corazón', 'B+', 7, 180, 60, 'Hospital Austral');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asignaciones`
--
ALTER TABLE `asignaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `donanteId` (`donanteId`),
  ADD KEY `receptorId` (`receptorId`);

--
-- Indices de la tabla `donantes`
--
ALTER TABLE `donantes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `receptores`
--
ALTER TABLE `receptores`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asignaciones`
--
ALTER TABLE `asignaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `donantes`
--
ALTER TABLE `donantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `receptores`
--
ALTER TABLE `receptores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asignaciones`
--
ALTER TABLE `asignaciones`
  ADD CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`donanteId`) REFERENCES `donantes` (`id`),
  ADD CONSTRAINT `asignaciones_ibfk_2` FOREIGN KEY (`receptorId`) REFERENCES `receptores` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
