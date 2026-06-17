-- ============================================================
-- Ops RH — données de démonstration
-- À exécuter APRÈS 0001_init.sql et 0002_rls.sql.
--
-- Remplacez OWNER_UUID par l'id de votre utilisateur (table profiles)
-- une fois inscrit, puis exécutez ce script dans le SQL Editor Supabase.
-- ============================================================

-- \set owner '00000000-0000-0000-0000-000000000001'
-- Adaptez l'identifiant ci-dessous à votre compte.
do $$
declare
  owner uuid := '00000000-0000-0000-0000-000000000001';
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  d1 uuid := gen_random_uuid();
  d4 uuid := gen_random_uuid();
  d5 uuid := gen_random_uuid();
  cl1 uuid := gen_random_uuid();
begin
  -- Clients
  insert into clients (id, owner_id, name, sector, address, siret, main_contact_name, main_contact_email, main_contact_phone, status, notes, collaboration_type, collaboration_start_date)
  values
    (c1, owner, 'Alpha Services', 'Services aux entreprises', '12 rue des Lilas, 97200 Fort-de-France', '812 345 678 00021', 'Marie Laurent', 'marie.laurent@alpha-services.fr', '06 12 34 56 78', 'actif', 'Cliente fidèle depuis 2024. Forfait mensuel + prestations ponctuelles.', 'Forfait mensuel', current_date - 300),
    (c2, owner, 'Caraïbes Distribution', 'Grande distribution', 'ZI La Lézarde, 97232 Le Lamentin', '509 876 543 00014', 'Julien Moreau', 'j.moreau@caraibes-distrib.com', '06 98 76 54 32', 'actif', 'Plusieurs onboardings en cours.', 'Régie + forfait', current_date - 150);

  -- Contacts (avec accès portail)
  insert into client_contacts (client_id, name, email, phone, role, portal_access)
  values
    (c1, 'Marie Laurent', 'marie.laurent@alpha-services.fr', '06 12 34 56 78', 'Gérante', true),
    (c2, 'Julien Moreau', 'j.moreau@caraibes-distrib.com', '06 98 76 54 32', 'Responsable RH', true);

  -- Dossiers RH
  insert into hr_cases (id, owner_id, client_id, title, person_name, case_type, description, status, priority, due_date, internal_notes)
  values
    (d1, owner, c1, 'Embauche — Clara Martin', 'Clara Martin', 'embauche', 'Recrutement assistante commerciale en CDI.', 'en_attente_client', 'haute', current_date + 4, 'Relancer pour RIB et pièce d''identité.'),
    (gen_random_uuid(), owner, c1, 'Point RH mensuel', null, 'accompagnement', 'Point mensuel avec la gérante.', 'a_valider', 'normale', current_date + 2, 'Compte rendu à générer.'),
    (d4, owner, c2, 'Onboarding — Assistant administratif', 'Kevin Rosé', 'onboarding', 'Parcours d''intégration nouvel assistant.', 'en_cours', 'haute', current_date + 6, null),
    (d5, owner, c2, 'Mise à jour documents salariés', null, 'suivi_salarie', 'Campagne de mise à jour des documents.', 'bloque', 'haute', current_date - 2, 'Bloqué : liste salariés attendue depuis 9 jours.');

  -- Checklist + items (dossier embauche)
  insert into document_checklists (id, owner_id, client_id, hr_case_id, title)
  values (cl1, owner, c1, d1, 'Dossier d''embauche');

  insert into checklist_items (checklist_id, name, required, status, comment)
  values
    (cl1, 'Pièce d''identité', true, 'demande', 'Recto-verso lisible'),
    (cl1, 'RIB', true, 'demande', null),
    (cl1, 'Justificatif de domicile', true, 'recu', null),
    (cl1, 'Contrat signé', true, 'demande', null),
    (cl1, 'CV', false, 'valide', null);

  -- Tâches
  insert into tasks (owner_id, client_id, hr_case_id, title, type, status, priority, due_date, estimated_minutes)
  values
    (owner, c1, d1, 'Relancer pour le RIB', 'relance_client', 'a_faire', 'haute', current_date, 15),
    (owner, c2, d4, 'Vérifier les documents reçus', 'verification_dossier', 'en_cours', 'normale', current_date, 20),
    (owner, c2, d5, 'Relancer pour la liste des salariés', 'relance_client', 'en_retard', 'urgente', current_date - 3, 15),
    (owner, c1, null, 'Préparer la pré-facture du mois', 'facturation', 'a_faire', 'normale', current_date + 1, 30);

  -- Temps passé
  insert into time_entries (owner_id, client_id, hr_case_id, date, duration_minutes, description, billable, hourly_rate)
  values
    (owner, c1, d1, current_date - 1, 90, 'Constitution dossier embauche', true, 65),
    (owner, c2, d4, current_date - 1, 75, 'Onboarding — préparation', true, 70),
    (owner, c2, d5, current_date - 3, 45, 'Suivi documents salariés', true, 70);

  -- Pré-factures
  insert into pre_invoices (owner_id, client_id, period_start, period_end, subtotal, total, status, notes)
  values
    (owner, c1, current_date - 30, current_date, 850, 850, 'a_preparer', 'Forfait mensuel + prestations ponctuelles.'),
    (owner, c2, current_date - 30, current_date, 1260, 1260, 'a_verifier', 'Régie 18h + forfait onboarding.');

  -- Demande client
  insert into client_requests (client_id, title, type, priority, description, status, due_date)
  values (c2, 'Besoin d''un modèle d''attestation de travail', 'besoin_document', 'normale', 'Pourriez-vous préparer une attestation de travail ?', 'nouvelle', current_date + 5);

  -- Notifications
  insert into notifications (user_id, client_id, hr_case_id, title, message, type, status)
  values
    (owner, c2, d4, 'Nouveau document déposé', 'Kevin Rosé a déposé sa pièce d''identité.', 'document_depose', 'non_lue'),
    (owner, c2, d5, 'Dossier bloqué', '« Mise à jour documents salariés » est bloqué depuis 9 jours.', 'dossier_bloque', 'non_lue');
end $$;
