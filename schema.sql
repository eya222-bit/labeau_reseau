-- =========================================================================
-- Schéma MySQL pour l'application NetSim Lab (Base de données: analyse)
-- Mot de passe configuré : AdAs@123
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `analyse`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `analyse`;

-- 1. Table principale pour l'historique des trames capturées (Wireshark)
CREATE TABLE IF NOT EXISTS `captured_packets` (
  `id` VARCHAR(64) NOT NULL,
  `timestamp` VARCHAR(32) NOT NULL,
  `src_device_name` VARCHAR(128) NOT NULL,
  `dst_device_name` VARCHAR(128) NOT NULL,
  `src_ip` VARCHAR(64) NOT NULL,
  `dst_ip` VARCHAR(64) NOT NULL,
  `protocol` VARCHAR(32) NOT NULL,
  `length` INT NOT NULL,
  `info` TEXT NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `headers_json` JSON NULL,
  `saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_protocol` (`protocol`),
  INDEX `idx_src_ip` (`src_ip`),
  INDEX `idx_dst_ip` (`dst_ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table pour stocker les sessions d'analyse réseau
CREATE TABLE IF NOT EXISTS `analysis_sessions` (
  `id` VARCHAR(64) NOT NULL,
  `session_name` VARCHAR(255) NOT NULL,
  `total_packets` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des équipements et topologies réseau
CREATE TABLE IF NOT EXISTS `network_nodes` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `ip_address` VARCHAR(64) NULL,
  `mac_address` VARCHAR(64) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
