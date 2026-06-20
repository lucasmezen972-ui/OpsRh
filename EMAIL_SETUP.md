# Configuration e-mail

Adresse officielle : `contact@tradikom.com`

Variables requises :

- `CONTACT_EMAIL=contact@tradikom.com`
- `NEXT_PUBLIC_CONTACT_EMAIL=contact@tradikom.com`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=Ops RH <contact@tradikom.com>`

## Domaine Tradikom

Configurer le domaine dans Resend puis ajouter les enregistrements DNS fournis :

- SPF ;
- DKIM ;
- DMARC ;
- éventuels MX demandés par Resend.

Tous les e-mails transactionnels doivent utiliser :

- From : `Ops RH <contact@tradikom.com>`
- Reply-To : `contact@tradikom.com`

Les modèles doivent inclure :

> Besoin d'aide ? Contactez-nous à contact@tradikom.com.

Les erreurs d'envoi e-mail sont journalisées mais ne doivent pas annuler une mutation métier réussie.
