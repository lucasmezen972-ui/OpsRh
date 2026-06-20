# Checklist déploiement production

- [ ] Configurer les variables Supabase dans Vercel.
- [ ] Configurer les variables Stripe test en Preview.
- [ ] Configurer les variables Stripe live en Production.
- [ ] Configurer `CONTACT_EMAIL` et `NEXT_PUBLIC_CONTACT_EMAIL`.
- [ ] Configurer `RESEND_API_KEY` et `RESEND_FROM_EMAIL`.
- [ ] Appliquer les migrations Supabase sur une base de test.
- [ ] Vérifier les politiques RLS avec deux organisations distinctes.
- [ ] Vérifier les buckets privés Supabase Storage.
- [ ] Créer les Price ID Stripe mensuel et annuel.
- [ ] Configurer le webhook Stripe.
- [ ] Tester Checkout mensuel.
- [ ] Tester Checkout annuel.
- [ ] Tester Customer Portal.
- [ ] Tester un paiement échoué.
- [ ] Tester la fin d'essai.
- [ ] Vérifier qu'aucun mode démo ni identifiant démo n'apparaît.
- [ ] Vérifier que les pages publiques affichent `contact@tradikom.com`.
- [ ] Lancer `npm run typecheck`.
- [ ] Lancer `npm run lint`.
- [ ] Lancer `npm run build`.
- [ ] Lancer `npm run test:e2e`.

## Rollback

1. Désactiver temporairement le webhook Stripe.
2. Revenir au déploiement Vercel précédent.
3. Restaurer la base depuis le backup Supabase si la migration doit être annulée.
4. Réactiver le webhook après validation.
