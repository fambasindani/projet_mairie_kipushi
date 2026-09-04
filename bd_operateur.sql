-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.30 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour bd_operateur
CREATE DATABASE IF NOT EXISTS `bd_operateur` /*!40100 DEFAULT CHARACTER SET armscii8 COLLATE armscii8_bin */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bd_operateur`;

-- Listage de la structure de table bd_operateur. activites_economiques
CREATE TABLE IF NOT EXISTS `activites_economiques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secteur` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `activites_economiques_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.activites_economiques : ~4 rows (environ)
INSERT INTO `activites_economiques` (`id`, `code`, `nom`, `secteur`, `description`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 'COM-001', 'Commerce de détail', 'Commerce', 'Commerce de détail en magasin', 1, '2026-09-02 19:23:43', '2026-09-02 19:23:43'),
	(2, 'COM-002', 'Commerce de gros', 'Commerce', NULL, 1, '2026-09-02 19:24:13', '2026-09-02 19:24:13'),
	(3, 'IND-001', 'Industrie manufacturière', 'Industrie', 'Activité non lucrative', 1, '2026-09-02 19:24:31', '2026-09-03 12:05:59'),
	(4, 'ART-001', 'Artisanat', 'Artisanat', 'Activité Lucrative', 1, '2026-09-02 19:24:45', '2026-09-03 12:06:33');

-- Listage de la structure de table bd_operateur. biens_immobiliers
CREATE TABLE IF NOT EXISTS `biens_immobiliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `proprietaire_id` bigint unsigned NOT NULL,
  `adresse` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quartier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commune` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_quartier` bigint unsigned DEFAULT NULL,
  `parcelle_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_bien` enum('terrain','maison','appartement','immeuble','local_commercial','entrepot','autre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `superficie` decimal(10,2) DEFAULT NULL,
  `valeur_locative` decimal(20,2) DEFAULT NULL,
  `valeur_venale` decimal(20,2) DEFAULT NULL,
  `classement` tinyint DEFAULT NULL COMMENT '1er, 2e, 3e ou 4e rang',
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `biens_immobiliers_proprietaire_id_index` (`proprietaire_id`),
  KEY `biens_immobiliers_commune_index` (`commune`),
  KEY `biens_immobiliers_id_quartier_foreign` (`id_quartier`),
  CONSTRAINT `biens_immobiliers_id_quartier_foreign` FOREIGN KEY (`id_quartier`) REFERENCES `quartiers` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `biens_immobiliers_proprietaire_id_foreign` FOREIGN KEY (`proprietaire_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.biens_immobiliers : ~7 rows (environ)
INSERT INTO `biens_immobiliers` (`id`, `proprietaire_id`, `adresse`, `quartier`, `commune`, `id_quartier`, `parcelle_id`, `type_bien`, `superficie`, `valeur_locative`, `valeur_venale`, `classement`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 1, '123 Nouvelle Adresse', 'Nouveau Quartier', 'Gombe', NULL, 'PAR-001-2024', 'terrain', 500.50, 1000000.00, 15000000.00, 2, 1, '2026-09-03 06:57:54', '2026-09-03 07:08:19'),
	(2, 1, '45 Boulevard du 30 Juin', 'Limete', 'Limete', NULL, 'PAR-002-2024', 'maison', 200.00, 1500000.00, 25000000.00, 1, 1, '2026-09-03 07:03:05', '2026-09-03 07:03:05'),
	(3, 2, '12 Rue des Bateliers', 'Lemba', 'Lemba', NULL, 'PAR-003-2024', 'appartement', 85.00, 800000.00, 12000000.00, 3, 1, '2026-09-03 07:03:28', '2026-09-03 07:03:28'),
	(4, 2, '78 Avenue du Commerce', 'Gombe', 'Gombe', NULL, 'PAR-004-2024', 'local_commercial', 150.00, 2000000.00, 35000000.00, 1, 1, '2026-09-03 07:03:45', '2026-09-03 07:03:45'),
	(5, 1, '100 Avenue de l\'Indépendance', 'Gombe', 'Gombe', NULL, 'PAR-005-2024', 'immeuble', 800.00, 5000000.00, 80000000.00, 1, 1, '2026-09-03 07:04:02', '2026-09-03 07:04:02'),
	(6, 2, 'Zone Industrielle, Parcelle 12', 'Masina', 'Masina', NULL, 'PAR-006-2024', 'entrepot', 1200.00, 3000000.00, 45000000.00, 2, 1, '2026-09-03 07:04:21', '2026-09-03 07:04:21'),
	(7, 9, 'av kimoto 4', 'Matoto', 'KAMALONDO', 3, 'PAR-85464', 'entrepot', 100.00, 2000.00, 2300.00, 1, 1, '2026-09-03 17:45:27', '2026-09-03 17:45:27'),
	(8, 25, 'KWALO 4', NULL, 'KAMALONDO', NULL, '1458', 'appartement', 100.00, 22000.00, 25000.00, 1, 1, '2026-09-03 20:07:01', '2026-09-03 20:07:01');

-- Listage de la structure de table bd_operateur. communes
CREATE TABLE IF NOT EXISTS `communes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_ville` bigint unsigned DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `communes_code_unique` (`code`),
  KEY `communes_id_ville_foreign` (`id_ville`),
  CONSTRAINT `communes_id_ville_foreign` FOREIGN KEY (`id_ville`) REFERENCES `villes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.communes : ~2 rows (environ)
INSERT INTO `communes` (`id`, `nom`, `code`, `id_ville`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 'Kinshasa', 'KIN', 2, 1, '2026-09-02 20:43:17', '2026-09-03 11:23:57'),
	(2, 'Kintambo', 'KINT', 2, 1, '2026-09-03 10:37:59', '2026-09-03 11:23:43'),
	(3, 'KAMALONDO', 'KAM', 3, 1, '2026-09-03 17:43:16', '2026-09-03 17:43:16');

-- Listage de la structure de table bd_operateur. declarations_paiements
CREATE TABLE IF NOT EXISTS `declarations_paiements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `personne_id` bigint unsigned NOT NULL,
  `taxe_id` bigint unsigned NOT NULL,
  `bien_immobilier_id` bigint unsigned DEFAULT NULL,
  `vehicule_id` bigint unsigned DEFAULT NULL,
  `permis_id` bigint unsigned DEFAULT NULL,
  `exercice` year NOT NULL,
  `periode_debut` date NOT NULL,
  `periode_fin` date NOT NULL,
  `montant_base` decimal(20,2) NOT NULL,
  `montant_taxe` decimal(20,2) NOT NULL,
  `penalites` decimal(20,2) NOT NULL DEFAULT '0.00',
  `montant_total` decimal(20,2) NOT NULL,
  `date_limite_paiement` date NOT NULL,
  `date_paiement` date DEFAULT NULL,
  `statut` enum('en_attente','paye','en_retard','conteste','annule','exonere') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `reference_paiement` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `justificatif` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `declarations_paiements_personne_id_index` (`personne_id`),
  KEY `declarations_paiements_taxe_id_index` (`taxe_id`),
  KEY `declarations_paiements_statut_index` (`statut`),
  KEY `declarations_paiements_exercice_index` (`exercice`),
  KEY `declarations_paiements_bien_immobilier_id_index` (`bien_immobilier_id`),
  KEY `declarations_paiements_vehicule_id_index` (`vehicule_id`),
  KEY `declarations_paiements_permis_id_index` (`permis_id`),
  CONSTRAINT `declarations_paiements_bien_immobilier_id_foreign` FOREIGN KEY (`bien_immobilier_id`) REFERENCES `biens_immobiliers` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `declarations_paiements_permis_id_foreign` FOREIGN KEY (`permis_id`) REFERENCES `permis_autorisations` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `declarations_paiements_personne_id_foreign` FOREIGN KEY (`personne_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `declarations_paiements_taxe_id_foreign` FOREIGN KEY (`taxe_id`) REFERENCES `taxes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `declarations_paiements_vehicule_id_foreign` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.declarations_paiements : ~6 rows (environ)
INSERT INTO `declarations_paiements` (`id`, `personne_id`, `taxe_id`, `bien_immobilier_id`, `vehicule_id`, `permis_id`, `exercice`, `periode_debut`, `periode_fin`, `montant_base`, `montant_taxe`, `penalites`, `montant_total`, `date_limite_paiement`, `date_paiement`, `statut`, `reference_paiement`, `justificatif`, `observations`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, NULL, NULL, NULL, '2024', '2024-01-01', '2024-12-31', 500000.00, 80000.00, 0.00, 580000.00, '2026-12-31', '2026-09-02', 'paye', 'PAY-2024-001', 'recu_001.jpg', 'Patente 2024 - Grand commerce', '2026-09-02 20:16:51', '2026-09-02 20:18:20'),
	(2, 13, 3, NULL, NULL, NULL, '2026', '2026-09-04', '2026-10-12', 1000.00, 0.00, 0.00, 0.00, '2026-10-12', NULL, 'exonere', NULL, NULL, NULL, '2026-09-03 16:16:37', '2026-09-03 16:16:53'),
	(3, 2, 2, NULL, NULL, NULL, '2025', '2026-02-01', '2026-11-10', 4000.00, 5000.00, 0.00, 9000.00, '2026-11-10', '2026-09-03', 'paye', 'PAY-6A99BB4DD4650', NULL, NULL, '2026-09-03 16:21:25', '2026-09-03 16:24:13'),
	(4, 2, 1, NULL, NULL, NULL, '2026', '2026-01-01', '2026-12-31', 100000.00, 15000.00, 0.00, 115000.00, '2026-12-31', '2026-09-03', 'paye', 'PAY-6A99BBAE6315D', NULL, NULL, '2026-09-03 16:25:41', '2026-09-03 16:25:50'),
	(5, 2, 1, NULL, NULL, NULL, '2026', '2026-01-01', '2026-12-31', 100000.00, 15000.00, 0.00, 115000.00, '2026-12-31', '2026-09-03', 'paye', 'PAY-6A99BBFAD342C', NULL, NULL, '2026-09-03 16:27:00', '2026-09-03 16:27:06'),
	(6, 13, 1, NULL, NULL, NULL, '2026', '2026-01-01', '2026-12-31', 200000.00, 30000.00, 0.00, 230000.00, '2026-12-31', '2026-09-03', 'paye', 'PAY-6A99BD67B3AC0', NULL, NULL, '2026-09-03 16:27:17', '2026-09-03 16:33:11'),
	(7, 25, 5, NULL, NULL, NULL, '2026', '2026-09-08', '2026-09-10', 4000.00, 4000.00, 0.00, 8000.00, '2026-09-08', '2026-09-03', 'paye', 'PAY-6A99F48713F1F', NULL, NULL, '2026-09-03 20:28:11', '2026-09-03 20:28:23'),
	(8, 23, 5, NULL, NULL, NULL, '2026', '2026-10-15', '2026-12-21', 4000.00, 4000.00, 0.00, 8000.00, '2026-12-21', NULL, 'en_attente', NULL, NULL, NULL, '2026-09-04 05:08:32', '2026-09-04 05:08:32'),
	(9, 5, 3, NULL, NULL, NULL, '2026', '2026-09-04', '2026-10-14', 3500.00, 4000.00, 0.00, 7500.00, '2026-10-14', NULL, 'en_attente', NULL, NULL, NULL, '2026-09-04 17:34:52', '2026-09-04 17:34:52');

-- Listage de la structure de table bd_operateur. documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `personne_id` bigint unsigned NOT NULL,
  `type_document` enum('CNI','PASSEPORT','STATUTS','RCCM','PATENTE','QUITTANCE','AVATAR','AUTRE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_expiration` date DEFAULT NULL,
  `est_valide` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `documents_personne_id_index` (`personne_id`),
  KEY `documents_type_document_index` (`type_document`),
  CONSTRAINT `documents_personne_id_foreign` FOREIGN KEY (`personne_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.documents : ~4 rows (environ)
INSERT INTO `documents` (`id`, `personne_id`, `type_document`, `numero`, `fichier`, `date_expiration`, `est_valide`, `created_at`, `updated_at`) VALUES
	(1, 1, 'CNI', 'CNI-001234567', 'documents/1/c4I03EGRhV3DpQ5SpzW3J34PMMQTjHIdKxdljiSs.pdf', '2025-12-31', 1, '2026-09-03 07:34:02', '2026-09-03 07:34:02'),
	(2, 23, 'CNI', '77777', 'documents/23/OXU84VCrCO4CI2aClVy6vy3cac2L9BocoLaATAwz.pdf', NULL, 1, '2026-09-03 17:06:10', '2026-09-03 17:06:10'),
	(3, 23, 'QUITTANCE', 'qt-9854', 'documents/23/XcfzJylxDxpIWvikIhqtykEI4P5jg6tWXDlw4yGS.pdf', NULL, 1, '2026-09-03 17:14:43', '2026-09-03 17:14:43'),
	(4, 24, 'QUITTANCE', 'QT-58745', 'documents/24/4R2mJuA0NH72ewFdS5zGAVISmpCMfznx5ndRR6rD.pdf', NULL, 1, '2026-09-03 18:14:42', '2026-09-03 18:14:42'),
	(5, 1, 'PATENTE', 'mp-667', 'documents/1/9WPHxLNWHitSKJZCcRvepHRdDSh1o9NP7Te9ffCh.jpg', NULL, 1, '2026-09-04 08:06:51', '2026-09-04 08:06:51'),
	(6, 1, 'CNI', 'cart-6555', 'documents/1/Bxmi80mQq0fLxseovP974T8812znyqgUGPlcSNuW.jpg', NULL, 1, '2026-09-04 16:44:46', '2026-09-04 16:44:46'),
	(7, 25, 'CNI', 'CR-6544', 'documents/25/dAOPWCLC3rcxUcnOJzEay4Px13l6EhrxBKIwpPoX.jpg', NULL, 1, '2026-09-04 17:01:28', '2026-09-04 17:01:28');

-- Listage de la structure de table bd_operateur. factures
CREATE TABLE IF NOT EXISTS `factures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `declaration_paiement_id` bigint unsigned NOT NULL,
  `numero_facture` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_emission` datetime NOT NULL DEFAULT '2026-09-02 20:08:25',
  `montant_ht` decimal(20,2) NOT NULL,
  `montant_tva` decimal(20,2) NOT NULL DEFAULT '0.00',
  `montant_total` decimal(20,2) NOT NULL,
  `devise` enum('CDF','USD') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDF',
  `chemin_pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('emise','payee','annulee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'emise',
  `observations` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `factures_declaration_paiement_id_unique` (`declaration_paiement_id`),
  UNIQUE KEY `factures_numero_facture_unique` (`numero_facture`),
  KEY `factures_declaration_paiement_id_index` (`declaration_paiement_id`),
  KEY `factures_numero_facture_index` (`numero_facture`),
  KEY `factures_statut_index` (`statut`),
  CONSTRAINT `factures_declaration_paiement_id_foreign` FOREIGN KEY (`declaration_paiement_id`) REFERENCES `declarations_paiements` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.factures : ~5 rows (environ)
INSERT INTO `factures` (`id`, `declaration_paiement_id`, `numero_facture`, `date_emission`, `montant_ht`, `montant_tva`, `montant_total`, `devise`, `chemin_pdf`, `statut`, `observations`, `created_at`, `updated_at`) VALUES
	(1, 1, 'FAC-2026-09-00001', '2026-09-03 10:02:38', 500000.00, 80000.00, 580000.00, 'CDF', NULL, 'emise', 'Facture pour patente 2024', '2026-09-03 08:02:38', '2026-09-03 08:02:38'),
	(2, 3, 'FAC-2026-09-00002', '2026-09-03 18:24:13', 9000.00, 1440.00, 10440.00, 'CDF', NULL, 'payee', NULL, '2026-09-03 16:24:13', '2026-09-03 16:24:13'),
	(3, 4, 'FAC-2026-09-00003', '2026-09-03 18:25:50', 115000.00, 18400.00, 133400.00, 'CDF', NULL, 'payee', NULL, '2026-09-03 16:25:50', '2026-09-03 16:25:50'),
	(4, 5, 'FAC-2026-09-00004', '2026-09-03 18:27:06', 115000.00, 18400.00, 133400.00, 'CDF', NULL, 'payee', NULL, '2026-09-03 16:27:06', '2026-09-03 16:27:06'),
	(5, 6, 'FAC-2026-09-00005', '2026-09-03 18:33:11', 230000.00, 36800.00, 266800.00, 'CDF', NULL, 'payee', NULL, '2026-09-03 16:33:11', '2026-09-03 16:33:11'),
	(6, 7, 'FAC-2026-09-00006', '2026-09-03 22:28:23', 8000.00, 1280.00, 9280.00, 'CDF', NULL, 'payee', NULL, '2026-09-03 20:28:23', '2026-09-03 20:28:23');

-- Listage de la structure de table bd_operateur. identifiants_officiels
CREATE TABLE IF NOT EXISTS `identifiants_officiels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `personne_id` bigint unsigned NOT NULL,
  `type_identifiant` enum('RCCM','IDNAT','NUMERO_IMPOT','NIF','CNSS','ONEM','PASSEPORT','PERMIS_CONDURE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `valeur` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province_delivrance` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_delivrance` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifiants_officiels_type_identifiant_valeur_unique` (`type_identifiant`,`valeur`),
  KEY `identifiants_officiels_personne_id_index` (`personne_id`),
  CONSTRAINT `identifiants_officiels_personne_id_foreign` FOREIGN KEY (`personne_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.identifiants_officiels : ~2 rows (environ)
INSERT INTO `identifiants_officiels` (`id`, `personne_id`, `type_identifiant`, `valeur`, `province_delivrance`, `date_delivrance`, `date_expiration`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 1, 'RCCM', 'RCCM-2024-001', 'Kinshasa', '2024-01-01', '2025-12-31', 1, '2026-09-03 07:23:31', '2026-09-03 07:23:31'),
	(2, 1, 'IDNAT', 'CNI-001234567', 'Kinshasa', '2020-06-15', '2025-06-15', 1, '2026-09-03 07:23:59', '2026-09-03 07:23:59'),
	(3, 2, 'NIF', 'NIF-1234567890', 'Kinshasa', '2023-01-01', '2024-12-31', 1, '2026-09-03 07:24:47', '2026-09-03 07:24:47');

-- Listage de la structure de table bd_operateur. logs_audit
CREATE TABLE IF NOT EXISTS `logs_audit` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `utilisateur_id` bigint unsigned DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_cible` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enregistrement_id` bigint unsigned DEFAULT NULL,
  `anciennes_valeurs` json DEFAULT NULL,
  `nouvelles_valeurs` json DEFAULT NULL,
  `adresse_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `logs_audit_utilisateur_id_index` (`utilisateur_id`),
  KEY `logs_audit_action_index` (`action`),
  KEY `logs_audit_table_cible_index` (`table_cible`),
  CONSTRAINT `logs_audit_utilisateur_id_foreign` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.logs_audit : ~28 rows (environ)
INSERT INTO `logs_audit` (`id`, `utilisateur_id`, `action`, `table_cible`, `enregistrement_id`, `anciennes_valeurs`, `nouvelles_valeurs`, `adresse_ip`, `user_agent`, `created_at`, `updated_at`) VALUES
	(1, NULL, 'CREATE', 'personnes', 23, NULL, '{"id": 23, "nom": "Dupont", "sexe": "M", "type": "physique", "prenom": "Jean", "created_at": "2026-09-03 17:55:04", "updated_at": "2026-09-03 17:55:04"}', '127.0.0.1', 'Symfony', '2026-09-03 15:55:04', '2026-09-03 15:55:04'),
	(2, NULL, 'CREATE', 'personnes', 24, NULL, '{"id": 24, "nom": "Martin", "sexe": "F", "type": "physique", "prenom": "Marie", "created_at": "2026-09-03 17:55:04", "updated_at": "2026-09-03 17:55:04"}', '127.0.0.1', 'Symfony', '2026-09-03 15:55:04', '2026-09-03 15:55:04'),
	(3, NULL, 'UPDATE', 'utilisateurs', 1, '{"tentatives_connexion": 0}', '{"tentatives_connexion": 1}', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.9168', '2026-09-03 15:58:13', '2026-09-03 15:58:13'),
	(4, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-03T17:58:13.000000Z", "derniere_connexion": "2026-09-03T17:53:53.000000Z", "tentatives_connexion": 1}', '{"updated_at": "2026-09-03 18:02:24", "derniere_connexion": "2026-09-03 18:02:24", "tentatives_connexion": 0}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 16:02:24', '2026-09-03 16:02:24'),
	(5, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 16:02:24', '2026-09-03 16:02:24'),
	(6, 1, 'CREATE', 'taxes', 4, NULL, '{"id": 4, "nom": "fff", "code": "sss", "taux": 5000, "unite": "montant_fixe", "categorie": "foncier", "est_actif": true, "created_at": "2026-09-03 18:13:28", "est_locale": true, "updated_at": "2026-09-03 18:13:28", "description": "ok", "periodicite": "annuelle"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 16:13:28', '2026-09-03 16:13:28'),
	(7, 1, 'DELETE', 'taxes', 4, '{"id": 4, "nom": "fff", "code": "sss", "taux": "5000.0000", "unite": "montant_fixe", "bareme": null, "categorie": "foncier", "est_actif": 1, "created_at": "2026-09-03 18:13:28", "est_locale": 1, "updated_at": "2026-09-03 18:13:28", "description": "ok", "periodicite": "annuelle", "declarations_paiements_count": 0}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 16:13:36', '2026-09-03 16:13:36'),
	(8, 1, 'UPDATE', 'taxes', 3, '{"code": "FON-2024", "updated_at": "2026-09-02T22:04:03.000000Z"}', '{"code": "FON-2025", "updated_at": "2026-09-03 18:14:13"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 16:14:13', '2026-09-03 16:14:13'),
	(9, 1, 'UPDATE', 'taxes', 2, '{"taux": "0.0000", "updated_at": "2026-09-02T22:03:27.000000Z"}', '{"taux": 5000, "updated_at": "2026-09-03 18:18:53"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 16:18:53', '2026-09-03 16:18:53'),
	(10, 1, 'UPDATE', 'taxes', 1, '{"taux": "0.0000", "updated_at": "2026-09-02T22:02:43.000000Z"}', '{"taux": 4000, "updated_at": "2026-09-03 18:19:17"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 16:19:17', '2026-09-03 16:19:17'),
	(11, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-03T18:02:24.000000Z", "derniere_connexion": "2026-09-03T18:02:24.000000Z"}', '{"updated_at": "2026-09-03 19:29:37", "derniere_connexion": "2026-09-03 19:29:37"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:29:37', '2026-09-03 17:29:37'),
	(12, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:29:37', '2026-09-03 17:29:37'),
	(13, 1, 'CREATE', 'provinces', 2, NULL, '{"id": 2, "nom": "Haut Katanga", "code": "HT", "est_actif": true, "created_at": "2026-09-03 19:41:32", "updated_at": "2026-09-03 19:41:32"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:41:32', '2026-09-03 17:41:32'),
	(14, 1, 'UPDATE', 'villes', 1, '{"updated_at": "2026-09-03T13:15:31.000000Z", "id_province": 1}', '{"updated_at": "2026-09-03 19:41:47", "id_province": 2}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:41:47', '2026-09-03 17:41:47'),
	(15, 1, 'CREATE', 'villes', 3, NULL, '{"id": 3, "nom": "Kipushi", "code": "KIP", "est_actif": true, "created_at": "2026-09-03 19:42:10", "updated_at": "2026-09-03 19:42:10", "id_province": 2}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:42:10', '2026-09-03 17:42:10'),
	(16, 1, 'CREATE', 'communes', 3, NULL, '{"id": 3, "nom": "KAMALONDO", "code": "KAM", "id_ville": 3, "est_actif": true, "created_at": "2026-09-03 19:43:16", "updated_at": "2026-09-03 19:43:16"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:43:16', '2026-09-03 17:43:16'),
	(17, 1, 'CREATE', 'quartiers', 3, NULL, '{"id": 3, "nom": "Matoto", "code": "MAT", "est_actif": true, "commune_id": 3, "created_at": "2026-09-03 19:43:57", "updated_at": "2026-09-03 19:43:57"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:43:57', '2026-09-03 17:43:57'),
	(18, 1, 'CREATE', 'biens_immobiliers', 7, NULL, '{"id": 7, "adresse": "av kimoto 4", "commune": "KAMALONDO", "quartier": "Matoto", "est_actif": true, "type_bien": "entrepot", "classement": 1, "created_at": "2026-09-03 19:45:27", "superficie": 100, "updated_at": "2026-09-03 19:45:27", "id_quartier": 3, "parcelle_id": "PAR-85464", "valeur_venale": 2300, "proprietaire_id": 9, "valeur_locative": 2000}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:45:27', '2026-09-03 17:45:27'),
	(19, 1, 'CREATE', 'vehicules', 6, NULL, '{"id": 6, "poids": 2000, "marque": "Honda", "modele": "Civic", "couleur": "Noire", "est_actif": true, "created_at": "2026-09-03 19:48:14", "updated_at": "2026-09-03 19:48:14", "nombre_places": 6, "type_vehicule": "voiture", "proprietaire_id": 9, "annee_fabrication": 2018, "plaque_immatriculation": "KAT-58745"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:48:14', '2026-09-03 17:48:14'),
	(20, 1, 'CREATE', 'permis_autorisations', 1, NULL, '{"id": 1, "numero": "PERM-58744", "created_at": "2026-09-03 19:52:16", "est_valide": true, "updated_at": "2026-09-03 19:52:16", "personne_id": 9, "type_permis": "construire", "est_renouvele": false, "date_delivrance": "2026-09-03 00:00:00", "date_expiration": "2026-10-23 00:00:00"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:52:16', '2026-09-03 17:52:16'),
	(21, 1, 'UPDATE', 'permis_autorisations', 2, '{"numero": "PERM-TEST-001", "updated_at": "2026-09-03T19:54:30.000000Z"}', '{"numero": "PERM-TEST-002", "updated_at": "2026-09-03 19:58:46"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 17:58:46', '2026-09-03 17:58:46'),
	(22, 1, 'UPDATE', 'personnes', 1, '{"avatar": "avatars/1/1uJjc4kis4mb8WxbjkNepOC5XRiuYe28SHv3u3F8.png", "updated_at": "2026-09-03T10:01:53.000000Z"}', '{"avatar": "avatars/1/VKXlfTZXuydu49VdjT61QZNcueEMs3GaQSmf0SNo.png", "updated_at": "2026-09-03 20:06:29"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 18:06:29', '2026-09-03 18:06:29'),
	(23, 1, 'UPDATE', 'personnes', 1, '{"avatar": "avatars/1/VKXlfTZXuydu49VdjT61QZNcueEMs3GaQSmf0SNo.png", "updated_at": "2026-09-03T20:06:29.000000Z"}', '{"avatar": "avatars/1/WRpIMTMIwRlHnmTIUaJYO2OYo3VEryTn4BzNSuY3.png", "updated_at": "2026-09-03 20:07:16"}', '127.0.0.1', 'curl/8.21.0', '2026-09-03 18:07:16', '2026-09-03 18:07:16'),
	(24, 1, 'UPDATE', 'personnes', 1, '{"avatar": "avatars/1/WRpIMTMIwRlHnmTIUaJYO2OYo3VEryTn4BzNSuY3.png", "updated_at": "2026-09-03T20:07:16.000000Z"}', '{"avatar": "avatars/1/ApTv49zsI0xEra4sxMYdSDVh4t7MxC8Cpxh8oCha.jpg", "updated_at": "2026-09-03 20:07:53"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 18:07:53', '2026-09-03 18:07:53'),
	(25, 1, 'UPDATE', 'personnes', 1, '{"avatar": "avatars/1/ApTv49zsI0xEra4sxMYdSDVh4t7MxC8Cpxh8oCha.jpg", "updated_at": "2026-09-03T20:07:53.000000Z"}', '{"avatar": "avatars/1/Fa8yJ1JWqYcpFAAO5QGZLkLdhF9er0elGCPlmvYi.jpg", "updated_at": "2026-09-03 20:08:55"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 18:08:55', '2026-09-03 18:08:55'),
	(26, 1, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-03T19:29:37.000000Z", "mot_de_passe_hash": "$2y$12$LDlSrepN5/mCvkF0kLY5XuZO1hn0t5/kcX5cvmseZdGDcaG6Gz.pi"}', '{"updated_at": "2026-09-03 20:18:03", "mot_de_passe_hash": "$2y$12$AG4Vzn7EV73AlATnG9FKGexUHP0CAW/7mdbslHE1mL9HL4fSbhnye"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 18:18:03', '2026-09-03 18:18:03'),
	(27, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-03T20:18:03.000000Z", "derniere_connexion": "2026-09-03T19:29:37.000000Z"}', '{"updated_at": "2026-09-03 20:32:58", "derniere_connexion": "2026-09-03 20:32:58"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 18:32:58', '2026-09-03 18:32:58'),
	(28, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 18:32:58', '2026-09-03 18:32:58'),
	(29, 1, 'CREATE', 'roles', 8, NULL, '{"id": 8, "nom": "TestCustom", "created_at": "2026-09-03 21:29:05", "updated_at": "2026-09-03 21:29:05", "description": "test"}', '127.0.0.1', 'curl/8.21.0', '2026-09-03 19:29:05', '2026-09-03 19:29:05'),
	(30, 1, 'UPDATE', 'roles', 8, '{"nom": "TestCustom", "updated_at": "2026-09-03T21:29:05.000000Z", "description": "test"}', '{"nom": "TestCustomRenamed", "updated_at": "2026-09-03 21:29:11", "description": "updated"}', '127.0.0.1', 'curl/8.21.0', '2026-09-03 19:29:11', '2026-09-03 19:29:11'),
	(31, 1, 'DELETE', 'roles', 8, '{"id": 8, "nom": "TestCustomRenamed", "created_at": "2026-09-03 21:29:05", "updated_at": "2026-09-03 21:29:11", "description": "updated"}', NULL, '127.0.0.1', 'curl/8.21.0', '2026-09-03 19:29:17', '2026-09-03 19:29:17'),
	(32, NULL, 'UPDATE', 'utilisateurs', 3, '{"tentatives_connexion": 0}', '{"tentatives_connexion": 1}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:37:37', '2026-09-03 19:37:37'),
	(33, 1, 'CREATE', 'personnes', 25, NULL, '{"id": 25, "nom": "SALAMA", "sexe": "M", "type": "physique", "email": "salama@gmail.com", "ville": "Kinshasa", "prenom": "Pascal", "adresse": "KWANGO 45", "commune": "Kintambo", "id_ville": 2, "province": "Kinshasa", "quartier": "Misau", "est_actif": true, "telephone": "0898596501", "created_at": "2026-09-03 21:40:05", "updated_at": "2026-09-03 21:40:05", "id_province": 1, "id_quartier": 2, "nationalite": "Congolaise", "est_formalise": false, "date_naissance": "1992-04-02 00:00:00", "lieu_naissance": "Goma"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 19:40:05', '2026-09-03 19:40:05'),
	(34, 1, 'CREATE', 'utilisateurs', 6, NULL, '{"id": 6, "email": "salama@gmail.com", "est_actif": true, "created_at": "2026-09-03 21:41:20", "updated_at": "2026-09-03 21:41:20", "personne_id": 25, "nom_utilisateur": "salama", "mot_de_passe_hash": "$2y$12$SbnUxdCSwxng31TqninpD.a95v/mbZMX/vdvq5oDO12gC/rydn3cq"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 19:41:20', '2026-09-03 19:41:20'),
	(35, NULL, 'UPDATE', 'utilisateurs', 6, '{"tentatives_connexion": 0}', '{"tentatives_connexion": 1}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:41:59', '2026-09-03 19:41:59'),
	(36, NULL, 'UPDATE', 'utilisateurs', 6, '{"tentatives_connexion": 1}', '{"tentatives_connexion": 2}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:42:10', '2026-09-03 19:42:10'),
	(37, 1, 'DELETE', 'utilisateurs', 6, '{"id": 6, "email": "salama@gmail.com", "est_actif": 1, "created_at": "2026-09-03 21:41:20", "updated_at": "2026-09-03 21:42:10", "personne_id": 25, "est_verrouille": 0, "nom_utilisateur": "salama", "mot_de_passe_hash": "$2y$12$SbnUxdCSwxng31TqninpD.a95v/mbZMX/vdvq5oDO12gC/rydn3cq", "derniere_connexion": null, "tentatives_connexion": 2, "date_expiration_mot_de_passe": null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 19:44:22', '2026-09-03 19:44:22'),
	(38, 1, 'CREATE', 'utilisateurs', 7, NULL, '{"id": 7, "email": "salama@gmail.com", "est_actif": true, "created_at": "2026-09-03 21:45:08", "updated_at": "2026-09-03 21:45:08", "personne_id": 25, "nom_utilisateur": "salama", "mot_de_passe_hash": "$2y$12$FMUkxiWabCPslNAmwgAd5O7oSQeppw9S1FvL1WFeNcK2ZvD8zzd6a"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 19:45:08', '2026-09-03 19:45:08'),
	(39, NULL, 'UPDATE', 'utilisateurs', 7, '{"tentatives_connexion": 0}', '{"tentatives_connexion": 1}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:45:14', '2026-09-03 19:45:14'),
	(40, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-03T20:32:58.000000Z", "derniere_connexion": "2026-09-03T20:32:58.000000Z"}', '{"updated_at": "2026-09-03 21:46:26", "derniere_connexion": "2026-09-03 21:46:26"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 19:46:26', '2026-09-03 19:46:26'),
	(41, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 19:46:26', '2026-09-03 19:46:26'),
	(42, NULL, 'UPDATE', 'utilisateurs', 7, '{"tentatives_connexion": 1}', '{"tentatives_connexion": 2}', '127.0.0.1', 'curl/8.21.0', '2026-09-03 19:50:28', '2026-09-03 19:50:28'),
	(43, NULL, 'UPDATE', 'utilisateurs', 7, '{"updated_at": "2026-09-03T21:50:28.000000Z", "derniere_connexion": null}', '{"updated_at": "2026-09-03 21:51:20", "derniere_connexion": "2026-09-03 21:51:20"}', '127.0.0.1', 'curl/8.21.0', '2026-09-03 19:51:20', '2026-09-03 19:51:20'),
	(44, 7, 'LOGIN', 'utilisateurs', 7, NULL, '{"email": "salama@gmail.com"}', '127.0.0.1', 'curl/8.21.0', '2026-09-03 19:51:20', '2026-09-03 19:51:20'),
	(45, NULL, 'UPDATE', 'utilisateurs', 7, '{"updated_at": "2026-09-03T21:51:20.000000Z", "derniere_connexion": "2026-09-03T21:51:20.000000Z"}', '{"updated_at": "2026-09-03 21:51:27", "derniere_connexion": "2026-09-03 21:51:27"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:51:28', '2026-09-03 19:51:28'),
	(46, 7, 'LOGIN', 'utilisateurs', 7, NULL, '{"email": "salama@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:51:28', '2026-09-03 19:51:28'),
	(47, NULL, 'UPDATE', 'utilisateurs', 7, '{"updated_at": "2026-09-03T21:51:27.000000Z", "derniere_connexion": "2026-09-03T21:51:27.000000Z"}', '{"updated_at": "2026-09-03 21:56:25", "derniere_connexion": "2026-09-03 21:56:25"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:56:25', '2026-09-03 19:56:25'),
	(48, 7, 'LOGIN', 'utilisateurs', 7, NULL, '{"email": "salama@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:56:25', '2026-09-03 19:56:25'),
	(49, NULL, 'UPDATE', 'utilisateurs', 7, '{"updated_at": "2026-09-03T21:56:25.000000Z", "derniere_connexion": "2026-09-03T21:56:25.000000Z"}', '{"updated_at": "2026-09-03 21:58:55", "derniere_connexion": "2026-09-03 21:58:55"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:58:55', '2026-09-03 19:58:55'),
	(50, 7, 'LOGIN', 'utilisateurs', 7, NULL, '{"email": "salama@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 19:58:55', '2026-09-03 19:58:55'),
	(51, NULL, 'UPDATE', 'utilisateurs', 7, '{"updated_at": "2026-09-03T21:58:55.000000Z", "derniere_connexion": "2026-09-03T21:58:55.000000Z"}', '{"updated_at": "2026-09-03 22:03:47", "derniere_connexion": "2026-09-03 22:03:47"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 20:03:47', '2026-09-03 20:03:47'),
	(52, 7, 'LOGIN', 'utilisateurs', 7, NULL, '{"email": "salama@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-03 20:03:47', '2026-09-03 20:03:47'),
	(53, 1, 'CREATE', 'biens_immobiliers', 8, NULL, '{"id": 8, "adresse": "KWALO 4", "commune": "KAMALONDO", "quartier": null, "est_actif": true, "type_bien": "appartement", "classement": 1, "created_at": "2026-09-03 22:07:01", "superficie": 100, "updated_at": "2026-09-03 22:07:01", "id_quartier": null, "parcelle_id": "1458", "valeur_venale": 25000, "proprietaire_id": 25, "valeur_locative": 22000}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 20:07:01', '2026-09-03 20:07:01'),
	(54, 1, 'CREATE', 'permis_autorisations', 3, NULL, '{"id": 3, "numero": "PERM-58741", "created_at": "2026-09-03 22:21:17", "est_valide": true, "updated_at": "2026-09-03 22:21:17", "personne_id": 25, "type_permis": "construire", "est_renouvele": false, "date_delivrance": "2026-09-10 00:00:00", "date_expiration": "2026-09-26 00:00:00"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 20:21:18', '2026-09-03 20:21:18'),
	(55, 1, 'CREATE', 'taxes', 5, NULL, '{"id": 5, "nom": "Construction", "code": "TAX-4587", "taux": 4000, "unite": "montant_fixe", "categorie": "permis_construire", "est_actif": true, "created_at": "2026-09-03 22:25:52", "est_locale": false, "updated_at": "2026-09-03 22:25:52", "description": "Taxe pour permis de construire", "periodicite": "annuelle"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-03 20:25:52', '2026-09-03 20:25:52'),
	(56, NULL, 'UPDATE', 'utilisateurs', 7, '{"updated_at": "2026-09-03T22:03:47.000000Z", "derniere_connexion": "2026-09-03T22:03:47.000000Z"}', '{"updated_at": "2026-09-04 06:54:40", "derniere_connexion": "2026-09-04 06:54:40"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-04 04:54:40', '2026-09-04 04:54:40'),
	(57, 7, 'LOGIN', 'utilisateurs', 7, NULL, '{"email": "salama@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0', '2026-09-04 04:54:40', '2026-09-04 04:54:40'),
	(58, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-03T21:46:26.000000Z", "derniere_connexion": "2026-09-03T21:46:26.000000Z"}', '{"updated_at": "2026-09-04 07:59:02", "derniere_connexion": "2026-09-04 07:59:02"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 05:59:02', '2026-09-04 05:59:02'),
	(59, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 05:59:03', '2026-09-04 05:59:03'),
	(60, 1, 'LOGOUT', 'utilisateurs', 1, '{"email": "pierrepapy@gmail.com"}', NULL, '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 06:14:05', '2026-09-04 06:14:05'),
	(61, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T07:59:02.000000Z", "derniere_connexion": "2026-09-04T07:59:02.000000Z"}', '{"updated_at": "2026-09-04 08:42:49", "derniere_connexion": "2026-09-04 08:42:49"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 06:42:49', '2026-09-04 06:42:49'),
	(62, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 06:42:49', '2026-09-04 06:42:49'),
	(63, 1, 'CREATE', 'personnes', 26, NULL, '{"id": 26, "nom": "gg", "sexe": "F", "type": "physique", "prenom": "vv", "est_actif": true, "created_at": "2026-09-04 09:40:37", "updated_at": "2026-09-04 09:40:37", "est_formalise": false}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 07:40:37', '2026-09-04 07:40:37'),
	(64, 1, 'DELETE', 'personnes', 26, '{"id": 26, "nom": "gg", "sexe": "F", "type": "physique", "email": null, "ville": null, "avatar": null, "prenom": "vv", "adresse": null, "commune": null, "id_ville": null, "latitude": null, "province": null, "quartier": null, "site_web": null, "est_actif": 1, "longitude": null, "telephone": null, "cni_numero": null, "created_at": "2026-09-04 09:40:37", "updated_at": "2026-09-04 09:40:37", "id_province": null, "id_quartier": null, "nationalite": null, "telephone_2": null, "date_creation": null, "est_formalise": 0, "date_naissance": null, "lieu_naissance": null, "forme_juridique": null, "date_formalisation": null, "denomination_sociale": null}', NULL, '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 07:40:54', '2026-09-04 07:40:54'),
	(65, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T08:42:49.000000Z", "derniere_connexion": "2026-09-04T08:42:49.000000Z"}', '{"updated_at": "2026-09-04 17:50:05", "derniere_connexion": "2026-09-04 17:50:05"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 15:50:05', '2026-09-04 15:50:05'),
	(66, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 15:50:07', '2026-09-04 15:50:07'),
	(67, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T17:50:05.000000Z", "derniere_connexion": "2026-09-04T17:50:05.000000Z"}', '{"updated_at": "2026-09-04 18:22:41", "derniere_connexion": "2026-09-04 18:22:41"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 16:22:41', '2026-09-04 16:22:41'),
	(68, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 16:22:41', '2026-09-04 16:22:41'),
	(69, 1, 'CREATE', 'personnes', 27, NULL, '{"id": 27, "nom": "g", "type": "physique", "prenom": "b", "adresse": "f", "est_actif": true, "telephone": "5", "cni_numero": "g", "created_at": "2026-09-04 18:26:40", "updated_at": "2026-09-04 18:26:40", "est_formalise": false, "date_naissance": "2026-09-16 00:00:00", "lieu_naissance": "d"}', '192.168.1.35', 'Dart/3.9 (dart:io)', '2026-09-04 16:26:41', '2026-09-04 16:26:41'),
	(70, 1, 'DELETE', 'personnes', 27, '{"id": 27, "nom": "g", "sexe": null, "type": "physique", "email": null, "ville": null, "avatar": null, "prenom": "b", "adresse": "f", "commune": null, "id_ville": null, "latitude": null, "province": null, "quartier": null, "site_web": null, "est_actif": 1, "longitude": null, "telephone": "5", "cni_numero": "g", "created_at": "2026-09-04 18:26:40", "updated_at": "2026-09-04 18:26:40", "id_province": null, "id_quartier": null, "nationalite": null, "telephone_2": null, "date_creation": null, "est_formalise": 0, "date_naissance": "2026-09-16", "lieu_naissance": "d", "forme_juridique": null, "date_formalisation": null, "denomination_sociale": null}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 16:27:25', '2026-09-04 16:27:25'),
	(71, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T18:22:41.000000Z", "derniere_connexion": "2026-09-04T18:22:41.000000Z"}', '{"updated_at": "2026-09-04 18:44:06", "derniere_connexion": "2026-09-04 18:44:06"}', '192.168.1.35', 'Dart/3.9 (dart:io)', '2026-09-04 16:44:06', '2026-09-04 16:44:06'),
	(72, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '192.168.1.35', 'Dart/3.9 (dart:io)', '2026-09-04 16:44:07', '2026-09-04 16:44:07'),
	(73, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T18:44:06.000000Z", "derniere_connexion": "2026-09-04T18:44:06.000000Z"}', '{"updated_at": "2026-09-04 18:46:26", "derniere_connexion": "2026-09-04 18:46:26"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 16:46:26', '2026-09-04 16:46:26'),
	(74, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 16:46:26', '2026-09-04 16:46:26'),
	(75, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T18:46:26.000000Z", "derniere_connexion": "2026-09-04T18:46:26.000000Z"}', '{"updated_at": "2026-09-04 19:04:30", "derniere_connexion": "2026-09-04 19:04:30"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 17:04:30', '2026-09-04 17:04:30'),
	(76, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 17:04:30', '2026-09-04 17:04:30'),
	(77, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T19:04:30.000000Z", "derniere_connexion": "2026-09-04T19:04:30.000000Z"}', '{"updated_at": "2026-09-04 19:08:06", "derniere_connexion": "2026-09-04 19:08:06"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 17:08:06', '2026-09-04 17:08:06'),
	(78, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-04 17:08:06', '2026-09-04 17:08:06'),
	(79, NULL, 'UPDATE', 'utilisateurs', 1, '{"tentatives_connexion": 0}', '{"tentatives_connexion": 1}', '10.94.226.117', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.9168', '2026-09-04 17:19:14', '2026-09-04 17:19:14'),
	(80, NULL, 'UPDATE', 'utilisateurs', 1, '{"tentatives_connexion": 1}', '{"tentatives_connexion": 2}', '10.94.226.117', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.9168', '2026-09-04 17:19:20', '2026-09-04 17:19:20'),
	(81, NULL, 'UPDATE', 'utilisateurs', 1, '{"tentatives_connexion": 2}', '{"tentatives_connexion": 3}', '10.94.226.117', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; fr-FR) WindowsPowerShell/5.1.26100.9168', '2026-09-04 17:19:21', '2026-09-04 17:19:21'),
	(82, 1, 'CREATE', 'taxes', 6, NULL, '{"id": 6, "nom": "hhh", "code": "hhh", "taux": 5, "unite": "pourcentage", "categorie": "autre", "est_actif": true, "created_at": "2026-09-04 19:24:23", "est_locale": true, "updated_at": "2026-09-04 19:24:23", "periodicite": "annuelle"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:24:23', '2026-09-04 17:24:23'),
	(83, 1, 'DELETE', 'taxes', 6, '{"id": 6, "nom": "hhh", "code": "hhh", "taux": "5.0000", "unite": "pourcentage", "bareme": null, "categorie": "autre", "est_actif": 1, "created_at": "2026-09-04 19:24:23", "est_locale": 1, "updated_at": "2026-09-04 19:24:23", "description": null, "periodicite": "annuelle", "declarations_paiements_count": 0}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0', '2026-09-04 17:24:38', '2026-09-04 17:24:38'),
	(84, 1, 'LOGOUT', 'utilisateurs', 1, '{"email": "pierrepapy@gmail.com"}', NULL, '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:51:58', '2026-09-04 17:51:58'),
	(85, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T19:19:21.000000Z", "derniere_connexion": "2026-09-04T19:08:06.000000Z", "tentatives_connexion": 3}', '{"updated_at": "2026-09-04 19:53:23", "derniere_connexion": "2026-09-04 19:53:23", "tentatives_connexion": 0}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:53:23', '2026-09-04 17:53:23'),
	(86, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:53:23', '2026-09-04 17:53:23'),
	(87, 1, 'LOGOUT', 'utilisateurs', 1, '{"email": "pierrepapy@gmail.com"}', NULL, '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:54:05', '2026-09-04 17:54:05'),
	(88, NULL, 'UPDATE', 'utilisateurs', 1, '{"tentatives_connexion": 0}', '{"tentatives_connexion": 1}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:55:16', '2026-09-04 17:55:16'),
	(89, NULL, 'UPDATE', 'utilisateurs', 1, '{"updated_at": "2026-09-04T19:55:16.000000Z", "derniere_connexion": "2026-09-04T19:53:23.000000Z", "tentatives_connexion": 1}', '{"updated_at": "2026-09-04 19:55:28", "derniere_connexion": "2026-09-04 19:55:28", "tentatives_connexion": 0}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:55:28', '2026-09-04 17:55:28'),
	(90, 1, 'LOGIN', 'utilisateurs', 1, NULL, '{"email": "pierrepapy@gmail.com"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:55:28', '2026-09-04 17:55:28'),
	(91, 1, 'LOGOUT', 'utilisateurs', 1, '{"email": "pierrepapy@gmail.com"}', NULL, '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:55:34', '2026-09-04 17:55:34'),
	(92, NULL, 'UPDATE', 'utilisateurs', 7, '{"updated_at": "2026-09-04T06:54:40.000000Z", "derniere_connexion": "2026-09-04T06:54:40.000000Z"}', '{"updated_at": "2026-09-04 19:56:15", "derniere_connexion": "2026-09-04 19:56:15"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:56:15', '2026-09-04 17:56:15'),
	(93, 7, 'LOGIN', 'utilisateurs', 7, NULL, '{"email": "salama@gmail.com"}', '10.94.226.168', 'Dart/3.9 (dart:io)', '2026-09-04 17:56:15', '2026-09-04 17:56:15');

-- Listage de la structure de table bd_operateur. migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.migrations : ~44 rows (environ)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '2019_12_14_000001_create_personal_access_tokens_table', 1),
	(2, '2026_09_02_194606_create_activites_economiques_table', 1),
	(3, '2026_09_02_194606_create_communes_table', 1),
	(4, '2026_09_02_194606_create_permissions_table', 1),
	(5, '2026_09_02_194606_create_roles_table', 1),
	(6, '2026_09_02_194607_create_identifiants_officiels_table', 1),
	(7, '2026_09_02_194607_create_parametres_table', 1),
	(8, '2026_09_02_194607_create_personnes_table', 1),
	(9, '2026_09_02_194608_create_biens_immobiliers_table', 1),
	(10, '2026_09_02_194608_create_personne_activites_table', 1),
	(11, '2026_09_02_194608_create_vehicules_table', 1),
	(12, '2026_09_02_194609_create_documents_table', 1),
	(13, '2026_09_02_194609_create_permis_autorisations_table', 1),
	(14, '2026_09_02_194610_create_declarations_paiements_table', 1),
	(15, '2026_09_02_194610_create_notifications_table', 1),
	(16, '2026_09_02_194610_create_taxes_table', 1),
	(17, '2026_09_02_194611_create_factures_table', 1),
	(18, '2026_09_02_194611_create_utilisateurs_table', 1),
	(19, '2026_09_02_194612_create_logs_audit_table', 1),
	(20, '2026_09_02_194612_create_roles_permissions_table', 1),
	(21, '2026_09_02_194612_create_utilisateurs_roles_table', 1),
	(22, '2026_09_02_194613_add_foreign_keys_to_identifiants_officiels', 1),
	(23, '2026_09_02_194613_add_foreign_keys_to_personne_activites', 1),
	(24, '2026_09_02_194613_create_quartiers_table', 1),
	(25, '2026_09_02_194614_add_foreign_keys_to_biens_immobiliers', 1),
	(26, '2026_09_02_194614_add_foreign_keys_to_permis_autorisations', 1),
	(27, '2026_09_02_194614_add_foreign_keys_to_vehicules', 1),
	(28, '2026_09_02_194615_add_foreign_keys_to_declarations_paiements', 1),
	(29, '2026_09_02_194615_add_foreign_keys_to_factures', 1),
	(30, '2026_09_02_194616_add_foreign_keys_to_roles_permissions', 1),
	(31, '2026_09_02_194616_add_foreign_keys_to_utilisateurs', 1),
	(32, '2026_09_02_194616_add_foreign_keys_to_utilisateurs_roles', 1),
	(33, '2026_09_02_194617_add_foreign_keys_to_documents', 1),
	(34, '2026_09_02_194617_add_foreign_keys_to_logs_audit', 1),
	(35, '2026_09_02_194618_add_foreign_keys_to_notifications', 1),
	(36, '2026_09_02_194618_add_foreign_keys_to_quartiers', 1),
	(37, '2026_09_02_213212_modify_date_debut_in_personne_activites', 2),
	(38, '2026_09_03_100000_add_id_quartier_to_personnes_table', 3),
	(39, '2026_09_03_110000_create_provinces_table', 4),
	(40, '2026_09_03_110001_add_id_province_to_communes_table', 4),
	(41, '2026_09_03_110002_add_id_province_to_personnes_table', 4),
	(42, '2026_09_03_120000_create_villes_table', 4),
	(43, '2026_09_03_120001_add_id_ville_to_communes_table', 4),
	(44, '2026_09_03_120002_add_id_ville_to_personnes_table', 4),
	(45, '2026_09_03_130000_drop_id_province_from_communes_table', 5),
	(46, '2026_09_03_194109_add_id_quartier_to_biens_immobiliers_table', 6);

-- Listage de la structure de table bd_operateur. notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `personne_id` bigint unsigned NOT NULL,
  `type_notification` enum('paiement_echu','renouvellement_permis','controle_prochain','information') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sujet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `est_lue` tinyint(1) NOT NULL DEFAULT '0',
  `date_envoi` datetime NOT NULL DEFAULT '2026-09-02 20:08:24',
  `date_lecture` datetime DEFAULT NULL,
  `lien_action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_personne_id_index` (`personne_id`),
  KEY `notifications_est_lue_index` (`est_lue`),
  KEY `notifications_type_notification_index` (`type_notification`),
  CONSTRAINT `notifications_personne_id_foreign` FOREIGN KEY (`personne_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.notifications : ~1 rows (environ)
INSERT INTO `notifications` (`id`, `personne_id`, `type_notification`, `sujet`, `message`, `est_lue`, `date_envoi`, `date_lecture`, `lien_action`, `created_at`, `updated_at`) VALUES
	(1, 1, 'paiement_echu', 'Paiement en retard', 'Votre paiement pour la patente 2024 est en retard. Veuillez régulariser votre situation.', 1, '2026-09-03 09:14:11', '2026-09-03 09:15:08', '/paiements/1', '2026-09-03 07:14:11', '2026-09-03 07:15:08');

-- Listage de la structure de table bd_operateur. parametres
CREATE TABLE IF NOT EXISTS `parametres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valeur` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `est_modifiable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `parametres_cle_unique` (`cle`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.parametres : ~10 rows (environ)
INSERT INTO `parametres` (`id`, `cle`, `valeur`, `description`, `est_modifiable`, `created_at`, `updated_at`) VALUES
	(1, 'app_name', 'GS Opérateur', 'Nom de l\'application', 1, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(2, 'devise_defaut', 'CDF', 'Devise par défaut (CDF ou USD)', 0, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(3, 'taux_penalty_retard', '5', 'Taux de pénalité en % pour retard de paiement', 1, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(4, 'delai_paiement_jours', '30', 'Délai de paiement en jours après déclaration', 1, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(5, 'max_tentatives_connexion', '5', 'Nombre max de tentatives avant verrouillage', 1, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(6, 'duree_session_heures', '24', 'Durée de session en heures', 1, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(7, 'email_notifications', 'true', 'Activer les notifications par email', 1, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(8, 'logo_url', '/logo.png', 'URL du logo de l\'application', 1, '2026-09-03 16:07:52', '2026-09-03 16:07:52'),
	(9, 'version_api', '1.0.0', 'Version actuelle de l\'API', 0, '2026-09-03 16:07:53', '2026-09-03 16:07:53'),
	(10, 'maintenance_mode', 'false', 'Mode maintenance activé/désactivé', 0, '2026-09-03 16:07:53', '2026-09-03 16:07:53'),
	(11, 'taux_tva', '17', 'Taux de la Taxe sur la Valeur Ajoutée (TVA) en %', 1, '2026-09-03 20:30:41', '2026-09-04 15:54:36');

-- Listage de la structure de table bd_operateur. permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ressource` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_ressource_action_unique` (`ressource`,`action`),
  UNIQUE KEY `permissions_nom_unique` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.permissions : ~28 rows (environ)
INSERT INTO `permissions` (`id`, `nom`, `ressource`, `action`, `description`, `created_at`, `updated_at`) VALUES
	(1, 'operateur:create', 'operateur', 'create', 'Créer un nouvel opérateur', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(2, 'operateur:read', 'operateur', 'read', 'Consulter la liste et les détails des opérateurs', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(3, 'operateur:update', 'operateur', 'update', 'Modifier les informations d\'un opérateur', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(4, 'operateur:delete', 'operateur', 'delete', 'Supprimer un opérateur', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(5, 'operateur:validate', 'operateur', 'validate', 'Valider un opérateur (formalisation)', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(6, 'taxe:create', 'taxe', 'create', 'Créer une nouvelle taxe', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(7, 'taxe:read', 'taxe', 'read', 'Consulter la liste des taxes', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(8, 'taxe:update', 'taxe', 'update', 'Modifier une taxe', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(9, 'taxe:delete', 'taxe', 'delete', 'Supprimer une taxe', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(10, 'paiement:create', 'paiement', 'create', 'Créer une déclaration de paiement', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(11, 'paiement:read', 'paiement', 'read', 'Consulter les paiements', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(12, 'paiement:validate', 'paiement', 'validate', 'Valider un paiement', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(13, 'paiement:delete', 'paiement', 'delete', 'Supprimer un paiement', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(14, 'facture:create', 'facture', 'create', 'Générer une facture', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(15, 'facture:read', 'facture', 'read', 'Consulter les factures', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(16, 'facture:update', 'facture', 'update', 'Modifier une facture', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(17, 'facture:delete', 'facture', 'delete', 'Supprimer une facture', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(18, 'permis:create', 'permis', 'create', 'Délivrer un permis', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(19, 'permis:read', 'permis', 'read', 'Consulter les permis', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(20, 'permis:update', 'permis', 'update', 'Modifier un permis', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(21, 'permis:delete', 'permis', 'delete', 'Supprimer un permis', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(22, 'utilisateur:create', 'utilisateur', 'create', 'Créer un utilisateur', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(23, 'utilisateur:read', 'utilisateur', 'read', 'Consulter les utilisateurs', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(24, 'utilisateur:update', 'utilisateur', 'update', 'Modifier un utilisateur', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(25, 'utilisateur:delete', 'utilisateur', 'delete', 'Supprimer un utilisateur', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(26, 'statistique:read', 'statistique', 'read', 'Consulter les statistiques et rapports', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(27, 'audit:read', 'audit', 'read', 'Consulter les logs et historiques', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(65, 'dashboard:read', 'dashboard', 'read', 'Consulter le tableau de bord', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(66, 'role:create', 'role', 'create', 'Créer un rôle', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(67, 'role:read', 'role', 'read', 'Consulter les rôles', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(68, 'role:update', 'role', 'update', 'Modifier un rôle', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(69, 'role:delete', 'role', 'delete', 'Supprimer un rôle', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(70, 'permission:create', 'permission', 'create', 'Créer une permission', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(71, 'permission:read', 'permission', 'read', 'Consulter les permissions', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(72, 'permission:update', 'permission', 'update', 'Modifier une permission', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(73, 'permission:delete', 'permission', 'delete', 'Supprimer une permission', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(74, 'notification:read', 'notification', 'read', 'Consulter les notifications', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(75, 'notification:update', 'notification', 'update', 'Marquer les notifications comme lues', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(76, 'document:create', 'document', 'create', 'Uploader un document', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(77, 'document:read', 'document', 'read', 'Consulter les documents', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(78, 'document:delete', 'document', 'delete', 'Supprimer un document', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(79, 'identifiant:create', 'identifiant', 'create', 'Créer un identifiant officiel', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(80, 'identifiant:read', 'identifiant', 'read', 'Consulter les identifiants officiels', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(81, 'identifiant:update', 'identifiant', 'update', 'Modifier un identifiant officiel', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(82, 'identifiant:delete', 'identifiant', 'delete', 'Supprimer un identifiant officiel', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(83, 'rapport:read', 'rapport', 'read', 'Consulter les rapports', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(84, 'parametre:read', 'parametre', 'read', 'Consulter les paramètres', '2026-09-04 05:08:01', '2026-09-04 05:08:01'),
	(85, 'parametre:update', 'parametre', 'update', 'Modifier les paramètres', '2026-09-04 05:08:01', '2026-09-04 05:08:01');

-- Listage de la structure de table bd_operateur. permis_autorisations
CREATE TABLE IF NOT EXISTS `permis_autorisations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `personne_id` bigint unsigned NOT NULL,
  `type_permis` enum('patente','construire','occupation_sol','etalage','exploitation','transport','autre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_delivrance` date NOT NULL,
  `date_expiration` date DEFAULT NULL,
  `est_valide` tinyint(1) NOT NULL DEFAULT '1',
  `est_renouvele` tinyint(1) NOT NULL DEFAULT '0',
  `document_scan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permis_autorisations_type_permis_numero_unique` (`type_permis`,`numero`),
  KEY `permis_autorisations_personne_id_index` (`personne_id`),
  KEY `permis_autorisations_est_valide_index` (`est_valide`),
  CONSTRAINT `permis_autorisations_personne_id_foreign` FOREIGN KEY (`personne_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.permis_autorisations : ~2 rows (environ)
INSERT INTO `permis_autorisations` (`id`, `personne_id`, `type_permis`, `numero`, `date_delivrance`, `date_expiration`, `est_valide`, `est_renouvele`, `document_scan`, `created_at`, `updated_at`) VALUES
	(1, 9, 'construire', 'PERM-58744', '2026-09-03', '2026-10-23', 1, 0, NULL, '2026-09-03 17:52:16', '2026-09-03 17:52:16'),
	(2, 1, 'patente', 'PERM-TEST-002', '2026-01-15', '2027-01-15', 1, 0, NULL, '2026-09-03 17:54:30', '2026-09-03 17:58:46'),
	(3, 25, 'construire', 'PERM-58741', '2026-09-10', '2026-09-26', 1, 0, NULL, '2026-09-03 20:21:17', '2026-09-03 20:21:17');

-- Listage de la structure de table bd_operateur. personal_access_tokens
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.personal_access_tokens : ~18 rows (environ)
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
	(1, 'App\\Models\\Utilisateur', 1, 'auth_token', 'cc3ff7200e91b5d307867389b08ec044bf5642abcaaf7bf5cf3c1b27417794e7', '["*"]', '2026-09-03 07:35:20', NULL, '2026-09-02 18:37:51', '2026-09-03 07:35:20'),
	(2, 'App\\Models\\Utilisateur', 1, 'auth_token', 'd31b65da4681481dea82c13c20bb1fa0a82928013c08431d6f8cef073920a771', '["*"]', NULL, NULL, '2026-09-02 18:46:08', '2026-09-02 18:46:08'),
	(3, 'App\\Models\\Utilisateur', 1, 'auth_token', '94f016a2085627c45d375d5f57299d9c666a2bc4f604c3478843951587b2b63a', '["*"]', NULL, NULL, '2026-09-02 18:47:27', '2026-09-02 18:47:27'),
	(4, 'App\\Models\\Utilisateur', 1, 'auth_token', 'c9fa4d1492a6c94f35dc655b19fc650bba93251dfb45743721eef612a872795c', '["*"]', '2026-09-03 08:02:38', NULL, '2026-09-03 07:43:16', '2026-09-03 08:02:38'),
	(5, 'App\\Models\\Utilisateur', 1, 'auth_token', '9d650235ef13659aaed940c1114c9e1ff700f84179cd723115abe62ad7c643c4', '["*"]', NULL, NULL, '2026-09-03 08:54:07', '2026-09-03 08:54:07'),
	(6, 'App\\Models\\Utilisateur', 1, 'auth_token', '1338526e9ba30c5e1af00d4168daaa1f5074afebfd94cf88e2e1ea1323872846', '["*"]', '2026-09-03 09:07:05', NULL, '2026-09-03 09:04:09', '2026-09-03 09:07:05'),
	(7, 'App\\Models\\Utilisateur', 1, 'auth_token', '473b7db05561aa579a8dfe92529664a8a4a8a843bb9f5e32e98a113f5783b9a1', '["*"]', '2026-09-03 09:09:13', NULL, '2026-09-03 09:07:19', '2026-09-03 09:09:13'),
	(8, 'App\\Models\\Utilisateur', 1, 'auth_token', '5012946a80fdf663e41fcdd9ae07e828f2d89d4569164fa512184515de6868ec', '["*"]', '2026-09-03 09:19:40', NULL, '2026-09-03 09:09:18', '2026-09-03 09:19:40'),
	(9, 'App\\Models\\Utilisateur', 1, 'auth_token', '4990e677b34ee72d2291e62fcde5dd5ea5e990a6007c0ad0fec24e067b154901', '["*"]', '2026-09-03 09:20:14', NULL, '2026-09-03 09:20:10', '2026-09-03 09:20:14'),
	(10, 'App\\Models\\Utilisateur', 1, 'auth_token', 'f3c16ed1654be3146fd6fe7ebd3d8781846ac060f484545b6edfeed0e47ea09a', '["*"]', '2026-09-03 09:23:25', NULL, '2026-09-03 09:21:27', '2026-09-03 09:23:25'),
	(11, 'App\\Models\\Utilisateur', 1, 'auth_token', '9850e0bef11146cbd6d6dee3787cd9834cfbdd245377da59c54f64ffa5a6b2d2', '["*"]', '2026-09-03 20:31:05', NULL, '2026-09-03 09:23:58', '2026-09-03 20:31:05'),
	(12, 'App\\Models\\Utilisateur', 1, 'auth_token', '369c4601a6ade9e57fbac670da26de89e107e60e09e1bed19797c3dcdc62449e', '["*"]', '2026-09-03 12:30:14', NULL, '2026-09-03 10:32:57', '2026-09-03 12:30:14'),
	(13, 'App\\Models\\Utilisateur', 1, 'auth_token', 'b64287a95f73de091a922963d25eecf2549966772a4cdc8041f36a4aa321a2c7', '["*"]', '2026-09-03 15:27:23', NULL, '2026-09-03 15:19:29', '2026-09-03 15:27:23'),
	(14, 'App\\Models\\Utilisateur', 1, 'auth_token', '6a60dbd32893f0eddda38dbb6659c68d5baf02ff8f2c56075cd8081b5c7ce640', '["*"]', '2026-09-03 15:53:30', NULL, '2026-09-03 15:27:32', '2026-09-03 15:53:30'),
	(15, 'App\\Models\\Utilisateur', 1, 'auth_token', '4a19aacd6df05677de1e81622766287bdd22f334b318f240175e6e761d2111f7', '["*"]', '2026-09-03 16:02:08', NULL, '2026-09-03 15:53:53', '2026-09-03 16:02:08'),
	(16, 'App\\Models\\Utilisateur', 1, 'auth_token', 'fb8b1d0c2a0c498e4b7260ced5827a5fe85965f58130688b9bcb3d2b23bbce0d', '["*"]', '2026-09-03 17:28:37', NULL, '2026-09-03 16:02:24', '2026-09-03 17:28:37'),
	(17, 'App\\Models\\Utilisateur', 1, 'auth_token', 'bed76a62aded35ab4838cfc10d9f8e53e4a8e1576af0caf7bf133d3407faf3f3', '["*"]', '2026-09-03 19:45:57', NULL, '2026-09-03 17:29:37', '2026-09-03 19:45:57'),
	(18, 'App\\Models\\Utilisateur', 1, 'auth_token', '69221308f0dc4214950f4ede84f76b38d8ae71555e3a6153e5edb9d37d216328', '["*"]', '2026-09-03 19:37:35', NULL, '2026-09-03 18:32:58', '2026-09-03 19:37:35'),
	(19, 'App\\Models\\Utilisateur', 1, 'auth_token', '51381de09fe64ede611adc5934135e347e4a3734d381164807f0103b2e9cfc54', '["*"]', '2026-09-04 05:26:16', NULL, '2026-09-03 19:46:26', '2026-09-04 05:26:16'),
	(20, 'App\\Models\\Utilisateur', 7, 'auth_token', '910bdeebcb7461d95e142202a29d7d30d24f0415d2d8d90437a01f90542f3529', '["*"]', '2026-09-03 20:21:56', NULL, '2026-09-03 19:51:20', '2026-09-03 20:21:56'),
	(21, 'App\\Models\\Utilisateur', 7, 'auth_token', 'c3d2ed19e37f3a475fbf30735131bc07270119afc70454f539393bedecb53bee', '["*"]', '2026-09-03 19:55:29', NULL, '2026-09-03 19:51:28', '2026-09-03 19:55:29'),
	(22, 'App\\Models\\Utilisateur', 7, 'auth_token', '66f7ecb3e5ee57cacad9c5c4e02b5b57b83d2d5e5ab5346aabecb6a90ef2f537', '["*"]', '2026-09-03 19:58:26', NULL, '2026-09-03 19:56:25', '2026-09-03 19:58:26'),
	(23, 'App\\Models\\Utilisateur', 7, 'auth_token', 'deb6b9e262121761412e3b2b6cde78a8f3cb0cf73757dae24d95471e800a7141', '["*"]', '2026-09-03 20:02:10', NULL, '2026-09-03 19:58:55', '2026-09-03 20:02:10'),
	(24, 'App\\Models\\Utilisateur', 7, 'auth_token', 'b9b69c608018571d12b8365f686aecc607b198899aa0292b67199669ff9cc1f4', '["*"]', '2026-09-03 20:40:39', NULL, '2026-09-03 20:03:47', '2026-09-03 20:40:39'),
	(25, 'App\\Models\\Utilisateur', 7, 'auth_token', '84ba7c90382ce23562867c9f09b072b10e6c5cc638b9ad28fb277ada91203aaf', '["*"]', '2026-09-04 05:20:26', NULL, '2026-09-04 04:54:40', '2026-09-04 05:20:26'),
	(27, 'App\\Models\\Utilisateur', 1, 'auth_token', 'f6581f0daeffbbfa77665a60f38fc748a3ecf86344d40378d6b1c20292342fea', '["*"]', '2026-09-04 16:35:59', NULL, '2026-09-04 06:42:49', '2026-09-04 16:35:59'),
	(28, 'App\\Models\\Utilisateur', 1, 'auth_token', '7890d14712cb821511c453a355bb8fe371eb815fbc5e2b94ccaf1a061570bdc3', '["*"]', '2026-09-04 16:10:44', NULL, '2026-09-04 15:50:07', '2026-09-04 16:10:44'),
	(29, 'App\\Models\\Utilisateur', 1, 'auth_token', '25d203fb7a0c9f9b41e911a0b51243c2680b3e8c088785ec3855f3363363e240', '["*"]', '2026-09-04 16:43:23', NULL, '2026-09-04 16:22:41', '2026-09-04 16:43:23'),
	(31, 'App\\Models\\Utilisateur', 1, 'auth_token', '2a06972d163fa67327f382cc0db7d4248ed769d543195b6c87f8bf6cb5d9c6ff', '["*"]', '2026-09-04 17:03:03', NULL, '2026-09-04 16:46:26', '2026-09-04 17:03:03'),
	(32, 'App\\Models\\Utilisateur', 1, 'auth_token', 'e6bbbb4ba53459757a13822ee234ba43b4b5f5bbfd0f1cb1d8c7a67d8914f1ff', '["*"]', '2026-09-04 18:05:16', NULL, '2026-09-04 17:04:30', '2026-09-04 18:05:16'),
	(33, 'App\\Models\\Utilisateur', 1, 'auth_token', 'a46cfa20d7775b2302bb5eaa38d0febf5d34a73a98b94a67524e5d99e4a88a4e', '["*"]', '2026-09-04 17:26:32', NULL, '2026-09-04 17:08:06', '2026-09-04 17:26:32'),
	(36, 'App\\Models\\Utilisateur', 7, 'auth_token', '5ae23ee1a3187caba18802cf5cd049fd8694772122f0a003813d0963f923c932', '["*"]', '2026-09-04 17:56:41', NULL, '2026-09-04 17:56:15', '2026-09-04 17:56:41');

-- Listage de la structure de table bd_operateur. personnes
CREATE TABLE IF NOT EXISTS `personnes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('physique','morale') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationalite` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexe` enum('M','F') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cni_numero` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `denomination_sociale` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `forme_juridique` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_creation` date DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `quartier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_quartier` bigint unsigned DEFAULT NULL,
  `id_province` bigint unsigned DEFAULT NULL,
  `id_ville` bigint unsigned DEFAULT NULL,
  `commune` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ville` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone_2` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_web` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `est_formalise` tinyint(1) NOT NULL DEFAULT '0',
  `date_formalisation` datetime DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chemin de la photo de profil',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `personnes_nom_prenom_index` (`nom`,`prenom`),
  KEY `personnes_denomination_sociale_index` (`denomination_sociale`),
  KEY `personnes_commune_index` (`commune`),
  KEY `personnes_est_actif_index` (`est_actif`),
  KEY `personnes_type_index` (`type`),
  KEY `personnes_id_quartier_foreign` (`id_quartier`),
  KEY `personnes_id_province_foreign` (`id_province`),
  KEY `personnes_id_ville_foreign` (`id_ville`),
  CONSTRAINT `personnes_id_province_foreign` FOREIGN KEY (`id_province`) REFERENCES `provinces` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnes_id_quartier_foreign` FOREIGN KEY (`id_quartier`) REFERENCES `quartiers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnes_id_ville_foreign` FOREIGN KEY (`id_ville`) REFERENCES `villes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.personnes : ~9 rows (environ)
INSERT INTO `personnes` (`id`, `type`, `nom`, `prenom`, `date_naissance`, `lieu_naissance`, `nationalite`, `sexe`, `cni_numero`, `denomination_sociale`, `forme_juridique`, `date_creation`, `adresse`, `quartier`, `id_quartier`, `id_province`, `id_ville`, `commune`, `ville`, `province`, `telephone`, `telephone_2`, `email`, `site_web`, `est_actif`, `est_formalise`, `date_formalisation`, `latitude`, `longitude`, `avatar`, `created_at`, `updated_at`) VALUES
	(1, 'physique', 'Papy', 'Pierre', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Kinshasa, Gombe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '+243800000001', NULL, 'pierrepapy@gmail.com', NULL, 1, 1, NULL, NULL, NULL, 'avatars/1/Fa8yJ1JWqYcpFAAO5QGZLkLdhF9er0elGCPlmvYi.jpg', '2026-09-02 18:29:47', '2026-09-03 18:08:55'),
	(2, 'physique', 'LALA', 'Pierre', '1996-11-11', 'BUKAVU', 'Congolaise', 'M', NULL, NULL, NULL, NULL, 'KWANGO 14', 'Gombe', 1, 1, 2, 'Kinshasa', 'Kinshasa', 'Kinshasa', '078542145', NULL, 'lala@email.com', NULL, 1, 1, NULL, NULL, NULL, NULL, '2026-09-02 18:29:47', '2026-09-03 11:50:06'),
	(3, 'physique', 'Mbala', 'Marie', '1997-02-02', NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, 'Misau', 2, 1, 2, 'Kintambo', 'Kinshasa', 'Kinshasa', '0898564', NULL, 'marie.mbala@email.com', NULL, 1, 0, NULL, NULL, NULL, NULL, '2026-09-02 18:29:47', '2026-09-03 11:51:21'),
	(4, 'physique', 'Papy', 'Pierre', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pierrepapy@gmail.com', NULL, 1, 1, NULL, NULL, NULL, NULL, '2026-09-02 18:35:31', '2026-09-02 18:35:31'),
	(5, 'physique', 'mukulu', 'Jeanne', '1995-12-11', 'Boma', 'Congolaise', 'F', NULL, NULL, NULL, NULL, NULL, 'Gombe', 1, 1, 2, 'Kinshasa', 'Kinshasa', 'Kinshasa', '07854214', NULL, 'mukulu@email.com', NULL, 1, 1, NULL, NULL, NULL, NULL, '2026-09-02 18:35:31', '2026-09-03 11:48:02'),
	(9, 'morale', 'BAMBALI', 'Joseph', '1978-06-04', NULL, NULL, 'M', 'CNI-001234', 'ASBL', 'ASBL', NULL, 'Kinshasa, Gombe', 'Gombe', 1, 1, 2, 'Kinshasa', 'Kinshasa', 'Kinshasa', '+243811234567', NULL, 'ngongo@email.com', NULL, 1, 0, NULL, NULL, NULL, NULL, '2026-09-02 19:33:21', '2026-09-03 11:44:30'),
	(13, 'physique', 'NGUZA', 'David', '1992-02-02', 'Kolwezi', 'Congolaise', 'M', NULL, NULL, NULL, NULL, 'KWANGO 45', 'Misau', 2, 1, 2, 'Kintambo', 'Kinshasa', 'Kinshasa', '0978596501', '5478', 'nguza@gmail.com', NULL, 1, 0, NULL, NULL, NULL, NULL, '2026-09-03 11:40:04', '2026-09-03 12:01:12'),
	(23, 'physique', 'Dupont', 'Jean', NULL, NULL, NULL, 'M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, '2026-09-03 15:55:04', '2026-09-03 15:55:04'),
	(24, 'physique', 'Martin', 'Marie', NULL, NULL, NULL, 'F', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, '2026-09-03 15:55:04', '2026-09-03 15:55:04'),
	(25, 'physique', 'SALAMA', 'Pascal', '1992-04-02', 'Goma', 'Congolaise', 'M', NULL, NULL, NULL, NULL, 'KWANGO 45', 'Misau', 2, 1, 2, 'Kintambo', 'Kinshasa', 'Kinshasa', '0898596501', NULL, 'salama@gmail.com', NULL, 1, 0, NULL, NULL, NULL, NULL, '2026-09-03 19:40:05', '2026-09-03 19:40:05');

-- Listage de la structure de table bd_operateur. personne_activites
CREATE TABLE IF NOT EXISTS `personne_activites` (
  `personne_id` bigint unsigned NOT NULL,
  `activite_id` bigint unsigned NOT NULL,
  `est_principale` tinyint(1) NOT NULL DEFAULT '0',
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`personne_id`,`activite_id`),
  KEY `personne_activites_activite_id_index` (`activite_id`),
  CONSTRAINT `personne_activites_activite_id_foreign` FOREIGN KEY (`activite_id`) REFERENCES `activites_economiques` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `personne_activites_personne_id_foreign` FOREIGN KEY (`personne_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.personne_activites : ~4 rows (environ)
INSERT INTO `personne_activites` (`personne_id`, `activite_id`, `est_principale`, `date_debut`, `date_fin`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, '2024-01-01', NULL, '2026-09-03 07:47:22', '2026-09-03 07:47:22'),
	(1, 2, 0, '2024-06-01', NULL, '2026-09-03 07:47:22', '2026-09-03 07:47:22'),
	(9, 1, 0, NULL, NULL, '2026-09-02 19:33:21', '2026-09-02 19:33:21'),
	(9, 2, 0, NULL, NULL, '2026-09-02 19:33:21', '2026-09-02 19:33:21');

-- Listage de la structure de table bd_operateur. provinces
CREATE TABLE IF NOT EXISTS `provinces` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `provinces_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.provinces : ~2 rows (environ)
INSERT INTO `provinces` (`id`, `nom`, `code`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 'Kinshasa', 'KIN', 1, '2026-09-03 11:02:21', '2026-09-03 11:11:58'),
	(2, 'Haut Katanga', 'HT', 1, '2026-09-03 17:41:32', '2026-09-03 17:41:32');

-- Listage de la structure de table bd_operateur. quartiers
CREATE TABLE IF NOT EXISTS `quartiers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `commune_id` bigint unsigned NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quartiers_commune_id_code_unique` (`commune_id`,`code`),
  KEY `quartiers_commune_id_index` (`commune_id`),
  CONSTRAINT `quartiers_commune_id_foreign` FOREIGN KEY (`commune_id`) REFERENCES `communes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.quartiers : ~0 rows (environ)
INSERT INTO `quartiers` (`id`, `commune_id`, `nom`, `code`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Gombe', 'GOM', 1, '2026-09-02 20:43:45', '2026-09-02 20:43:45'),
	(2, 2, 'Misau', 'MIS', 1, '2026-09-03 10:43:00', '2026-09-03 10:43:00'),
	(3, 3, 'Matoto', 'MAT', 1, '2026-09-03 17:43:57', '2026-09-03 17:43:57');

-- Listage de la structure de table bd_operateur. roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_nom_unique` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.roles : ~6 rows (environ)
INSERT INTO `roles` (`id`, `nom`, `description`, `created_at`, `updated_at`) VALUES
	(1, 'Administrateur', 'Accès total au système - Gestion complète', NULL, NULL),
	(2, 'Agent_Mairie', 'Gestion des opérateurs et des taxes locales', NULL, NULL),
	(3, 'Agent_Recensement', 'Recensement sur le terrain et enregistrement des opérateurs', NULL, NULL),
	(4, 'Agent_Recouvrement', 'Gestion des paiements et recouvrement des taxes', NULL, NULL),
	(5, 'Operateur', 'Consultation de son propre dossier et paiement en ligne', NULL, NULL),
	(6, 'Auditeur', 'Consultation des données et audit sans modification', NULL, NULL);

-- Listage de la structure de table bd_operateur. roles_permissions
CREATE TABLE IF NOT EXISTS `roles_permissions` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `roles_permissions_permission_id_index` (`permission_id`),
  CONSTRAINT `roles_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `roles_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.roles_permissions : ~52 rows (environ)
INSERT INTO `roles_permissions` (`role_id`, `permission_id`, `created_at`, `updated_at`) VALUES
	(1, 1, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 2, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 3, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 4, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 5, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 6, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 7, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 8, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 9, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 10, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 11, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 12, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 13, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 14, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 15, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 16, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 17, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 18, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 19, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 20, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 21, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 22, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 23, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 24, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 25, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 26, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 27, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 65, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 66, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 67, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 68, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 69, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 70, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 71, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 72, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 73, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 74, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 75, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 76, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 77, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 78, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 79, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 80, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 81, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 82, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 83, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 84, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(1, 85, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 1, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 2, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 3, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 5, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 6, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 7, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 8, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 9, '2026-09-03 15:30:17', '2026-09-03 15:30:17'),
	(2, 10, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 11, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 12, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 14, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 15, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 16, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 17, '2026-09-03 15:29:40', '2026-09-03 15:29:40'),
	(2, 18, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 19, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 20, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 23, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 26, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 27, '2026-09-03 15:29:40', '2026-09-03 15:29:40'),
	(2, 65, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 74, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 75, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(2, 77, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(3, 1, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(3, 2, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(3, 3, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(3, 23, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(3, 74, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(3, 76, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(3, 77, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 2, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 10, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 11, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 12, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 14, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 15, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 26, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(4, 74, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 2, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 3, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 7, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 11, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 15, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 19, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 26, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 74, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 75, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 76, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 77, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 78, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 80, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(5, 83, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 2, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 7, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 11, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 15, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 26, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 27, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 65, '2026-09-04 17:09:45', '2026-09-04 17:09:45'),
	(6, 74, '2026-09-04 17:09:45', '2026-09-04 17:09:45');

-- Listage de la structure de table bd_operateur. taxes
CREATE TABLE IF NOT EXISTS `taxes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` enum('patente','foncier','revenus_locatifs','personnel_minimum','vehicule','permis_construire','etalage','autre') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'autre',
  `description` text COLLATE utf8mb4_unicode_ci,
  `taux` decimal(10,4) DEFAULT NULL,
  `unite` enum('pourcentage','montant_fixe','par_unite') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'montant_fixe',
  `periodicite` enum('mensuelle','trimestrielle','semestrielle','annuelle','evenementielle') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'annuelle',
  `bareme` json DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `est_locale` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `taxes_code_unique` (`code`),
  KEY `taxes_categorie_index` (`categorie`),
  KEY `taxes_est_actif_index` (`est_actif`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.taxes : ~3 rows (environ)
INSERT INTO `taxes` (`id`, `code`, `nom`, `categorie`, `description`, `taux`, `unite`, `periodicite`, `bareme`, `est_actif`, `est_locale`, `created_at`, `updated_at`) VALUES
	(1, 'PAT-2024', 'Patente 2024', 'patente', 'Taxe annuelle due par tout opérateur économique', 4000.0000, 'montant_fixe', 'annuelle', '{"categories": {"A": {"label": "Grand commerce", "montant": 500000}, "B": {"label": "Moyen commerce", "montant": 200000}, "C": {"label": "Petit commerce", "montant": 50000}}}', 1, 1, '2026-09-02 20:02:43', '2026-09-03 16:19:17'),
	(2, 'PAT-2025', 'Patente 2025', 'patente', 'Taxe annuelle due par tout opérateur économique', 5000.0000, 'montant_fixe', 'annuelle', '{"categories": {"A": {"label": "Grand commerce", "montant": 500000}, "B": {"label": "Moyen commerce", "montant": 200000}, "C": {"label": "Petit commerce", "montant": 50000}}}', 1, 1, '2026-09-02 20:03:27', '2026-09-03 16:18:53'),
	(3, 'FON-2025', 'Impôt foncier 2024', 'foncier', 'Taxe sur les propriétés bâties et non bâties', 5.0000, 'pourcentage', 'annuelle', NULL, 1, 1, '2026-09-02 20:04:03', '2026-09-03 16:14:13'),
	(5, 'TAX-4587', 'Construction', 'permis_construire', 'Taxe pour permis de construire', 4000.0000, 'montant_fixe', 'annuelle', NULL, 1, 0, '2026-09-03 20:25:52', '2026-09-03 20:25:52');

-- Listage de la structure de table bd_operateur. utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `personne_id` bigint unsigned NOT NULL,
  `nom_utilisateur` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `est_verrouille` tinyint(1) NOT NULL DEFAULT '0',
  `tentatives_connexion` tinyint unsigned NOT NULL DEFAULT '0',
  `derniere_connexion` datetime DEFAULT NULL,
  `date_expiration_mot_de_passe` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateurs_personne_id_unique` (`personne_id`),
  UNIQUE KEY `utilisateurs_nom_utilisateur_unique` (`nom_utilisateur`),
  UNIQUE KEY `utilisateurs_email_unique` (`email`),
  CONSTRAINT `utilisateurs_personne_id_foreign` FOREIGN KEY (`personne_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.utilisateurs : ~4 rows (environ)
INSERT INTO `utilisateurs` (`id`, `personne_id`, `nom_utilisateur`, `mot_de_passe_hash`, `email`, `est_actif`, `est_verrouille`, `tentatives_connexion`, `derniere_connexion`, `date_expiration_mot_de_passe`, `created_at`, `updated_at`) VALUES
	(1, 1, 'admin', '$2y$12$AG4Vzn7EV73AlATnG9FKGexUHP0CAW/7mdbslHE1mL9HL4fSbhnye', 'pierrepapy@gmail.com', 1, 0, 0, '2026-09-04 19:55:28', NULL, '2026-09-02 18:29:47', '2026-09-04 17:55:28'),
	(2, 2, 'jean.dupont', '$2y$12$OFHiT3XeNufyvt7aeEHhCO5.3IzHWABXV/jS5pgGejLVfn4f3CYkm', 'jean.dupont@email.com', 1, 0, 0, NULL, NULL, '2026-09-02 18:35:49', '2026-09-02 18:35:49'),
	(3, 3, 'marie.mbala', '$2y$12$Armb/thc0jcIs0DjEfWZkeHsVYRvSYFUbHykRr19TgCqp8v.0QXnK', 'marie.mbala@email.com', 1, 0, 1, NULL, NULL, '2026-09-02 18:35:49', '2026-09-03 19:37:37'),
	(4, 13, 'NGOMA Paul', '$2y$12$TstGZHCHUJivND1oCcWjauM3t3qwYLaRVKEsBaLq/gs9JxXSxW16i', 'ngoma@gmail.com', 1, 0, 0, NULL, NULL, '2026-09-02 18:53:45', '2026-09-03 12:08:02'),
	(7, 25, 'salama', '$2y$12$Eyy1aKAHCMPE0GX1lWMjOOKCTZXG4P0SXG2S1H2oRmtRANWLI0gJ.', 'salama@gmail.com', 1, 0, 0, '2026-09-04 19:56:15', NULL, '2026-09-03 19:45:08', '2026-09-04 17:56:15');

-- Listage de la structure de table bd_operateur. utilisateurs_roles
CREATE TABLE IF NOT EXISTS `utilisateurs_roles` (
  `utilisateur_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`utilisateur_id`,`role_id`),
  KEY `utilisateurs_roles_role_id_index` (`role_id`),
  CONSTRAINT `utilisateurs_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `utilisateurs_roles_utilisateur_id_foreign` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.utilisateurs_roles : ~4 rows (environ)
INSERT INTO `utilisateurs_roles` (`utilisateur_id`, `role_id`, `created_at`, `updated_at`) VALUES
	(1, 1, '2026-09-02 18:47:17', '2026-09-02 18:47:17'),
	(2, 3, '2026-09-02 18:35:49', '2026-09-02 18:35:49'),
	(3, 5, '2026-09-02 18:35:49', '2026-09-02 18:35:49'),
	(4, 2, '2026-09-02 18:53:45', '2026-09-02 18:53:45'),
	(7, 5, '2026-09-03 19:45:08', '2026-09-03 19:45:08');

-- Listage de la structure de table bd_operateur. vehicules
CREATE TABLE IF NOT EXISTS `vehicules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `proprietaire_id` bigint unsigned NOT NULL,
  `plaque_immatriculation` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marque` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modele` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `annee_fabrication` year DEFAULT NULL,
  `couleur` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_vehicule` enum('voiture','moto','poids_lourd','bus','minibus','taxi','autre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_places` tinyint DEFAULT NULL,
  `poids` decimal(10,2) DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicules_plaque_immatriculation_unique` (`plaque_immatriculation`),
  KEY `vehicules_proprietaire_id_index` (`proprietaire_id`),
  CONSTRAINT `vehicules_proprietaire_id_foreign` FOREIGN KEY (`proprietaire_id`) REFERENCES `personnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.vehicules : ~5 rows (environ)
INSERT INTO `vehicules` (`id`, `proprietaire_id`, `plaque_immatriculation`, `marque`, `modele`, `annee_fabrication`, `couleur`, `type_vehicule`, `nombre_places`, `poids`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 1, 'AA 1234 BC', 'Toyota', 'Land Cruiser', '2022', 'Noir', 'voiture', 8, 2500.50, 1, '2026-09-02 21:01:41', '2026-09-02 21:04:15'),
	(2, 1, 'BB 5678 DE', 'Honda', 'CBR 500', '2023', 'Rouge', 'moto', 2, 200.00, 1, '2026-09-02 21:02:14', '2026-09-02 21:02:14'),
	(3, 2, 'CC 9012 FG', 'Mercedes', 'Actros', '2021', 'Bleu', 'poids_lourd', 3, 8000.00, 1, '2026-09-02 21:02:37', '2026-09-02 21:02:37'),
	(4, 2, 'DD 3456 HI', 'Toyota', 'Hiace', '2022', 'Jaune', 'taxi', 8, 2200.00, 1, '2026-09-02 21:02:59', '2026-09-02 21:02:59'),
	(6, 9, 'KAT-58745', 'Honda', 'Civic', '2018', 'Noire', 'voiture', 6, 2000.00, 1, '2026-09-03 17:48:14', '2026-09-03 17:48:14');

-- Listage de la structure de table bd_operateur. villes
CREATE TABLE IF NOT EXISTS `villes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_province` bigint unsigned DEFAULT NULL,
  `est_actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `villes_code_unique` (`code`),
  KEY `villes_id_province_foreign` (`id_province`),
  CONSTRAINT `villes_id_province_foreign` FOREIGN KEY (`id_province`) REFERENCES `provinces` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table bd_operateur.villes : ~3 rows (environ)
INSERT INTO `villes` (`id`, `nom`, `code`, `id_province`, `est_actif`, `created_at`, `updated_at`) VALUES
	(1, 'Lubumbashi', 'LUB', 2, 1, '2026-09-03 11:15:31', '2026-09-03 17:41:47'),
	(2, 'Kinshasa', 'KIN', 1, 1, '2026-09-03 11:23:10', '2026-09-03 11:23:10'),
	(3, 'Kipushi', 'KIP', 2, 1, '2026-09-03 17:42:10', '2026-09-03 17:42:10');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
