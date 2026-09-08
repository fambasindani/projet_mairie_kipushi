<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification du reçu #{{ $recu->numero }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            color: #1a1a2e;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header .coat-of-arms {
            font-size: 32px;
            margin-bottom: 5px;
        }
        .header h1 {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .header h2 {
            font-size: 12px;
            font-weight: 400;
            opacity: 0.9;
            margin-top: 2px;
        }
        .valid-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #27ae60;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 12px;
        }
        .invalid-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #e74c3c;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 12px;
        }
        .container {
            padding: 16px;
            max-width: 500px;
            margin: 0 auto;
        }
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            overflow: hidden;
            margin-bottom: 16px;
        }
        .card-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #666;
            padding: 12px 16px 0;
        }
        .card-body {
            padding: 12px 16px 16px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-size: 13px;
            color: #888;
            font-weight: 500;
            min-width: 40%;
        }
        .info-value {
            font-size: 14px;
            font-weight: 600;
            text-align: right;
            color: #1a1a2e;
        }
        .montant-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: #f8f9fa;
        }
        .montant-label {
            font-size: 14px;
            color: #666;
        }
        .montant-value {
            font-size: 24px;
            font-weight: 700;
            color: #27ae60;
        }
        .footer {
            text-align: center;
            padding: 16px;
            color: #999;
            font-size: 11px;
        }
        .footer .divider {
            width: 40px;
            height: 3px;
            background: #ddd;
            border-radius: 2px;
            margin: 0 auto 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="coat-of-arms">🇨🇩</div>
        <h1>République Démocratique du Congo</h1>
        <h2>Ville de Bukavu — Service de Perception</h2>
        <div class="valid-badge">✓ Reçu authentique</div>
    </div>

    <div class="container">
        <div class="card">
            <div class="montant-row">
                <span class="montant-label">Montant perçu</span>
                <span class="montant-value">{{ number_format($recu->montant, 2, ',', '.') }} $</span>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Informations du reçu</div>
            <div class="card-body">
                <div class="info-row">
                    <span class="info-label">Numéro</span>
                    <span class="info-value">{{ $recu->numero }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Type</span>
                    <span class="info-value">{{ $recu->type_perception_label }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Taxe</span>
                    <span class="info-value">{{ $recu->taxe?->nom ?? '—' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date d'émission</span>
                    <span class="info-value">{{ $recu->date_emission->format('d/m/Y') }}</span>
                </div>
                @if($recu->heure_emission)
                <div class="info-row">
                    <span class="info-label">Heure</span>
                    <span class="info-value">{{ $recu->heure_emission }}</span>
                </div>
                @endif
            </div>
        </div>

        @if($recu->type_perception === 'peage_urbain')
        <div class="card">
            <div class="card-title">Détails du péage</div>
            <div class="card-body">
                @if($recu->chauffeur_nom)
                <div class="info-row">
                    <span class="info-label">Chauffeur</span>
                    <span class="info-value">{{ $recu->chauffeur_nom }}</span>
                </div>
                @endif
                @if($recu->plaque_immatriculation)
                <div class="info-row">
                    <span class="info-label">Plaque</span>
                    <span class="info-value">{{ $recu->plaque_immatriculation }}</span>
                </div>
                @endif
                @if($recu->categorie_vehicule)
                <div class="info-row">
                    <span class="info-label">Catégorie</span>
                    <span class="info-value">{{ $recu->categorie_vehicule }}</span>
                </div>
                @endif
                @if($recu->trajet)
                <div class="info-row">
                    <span class="info-label">Trajet</span>
                    <span class="info-value">{{ $recu->trajet_label }}</span>
                </div>
                @endif
            </div>
        </div>
        @endif

        @if($recu->type_perception === 'pont_bascule')
        <div class="card">
            <div class="card-title">Détails du pont bascule</div>
            <div class="card-body">
                @if($recu->conducteur_nom)
                <div class="info-row">
                    <span class="info-label">Conducteur</span>
                    <span class="info-value">{{ $recu->conducteur_nom }}</span>
                </div>
                @endif
                @if($recu->plaque_immatriculation)
                <div class="info-row">
                    <span class="info-label">Plaque</span>
                    <span class="info-value">{{ $recu->plaque_immatriculation }}</span>
                </div>
                @endif
                @if($recu->poids)
                <div class="info-row">
                    <span class="info-label">Poids</span>
                    <span class="info-value">{{ number_format($recu->poids, 2, ',', '.') }} kg</span>
                </div>
                @endif
            </div>
        </div>
        @endif

        @if(in_array($recu->type_perception, ['etalage', 'chargement', 'dechargement', 'autre']))
        <div class="card">
            <div class="card-title">Détails de la perception</div>
            <div class="card-body">
                @if($recu->personne)
                <div class="info-row">
                    <span class="info-label">Opérateur</span>
                    <span class="info-value">{{ $recu->personne->nom_complet }}</span>
                </div>
                @endif
                @if($recu->designation)
                <div class="info-row">
                    <span class="info-label">Désignation</span>
                    <span class="info-value">{{ $recu->designation }}</span>
                </div>
                @endif
            </div>
        </div>
        @endif

        @if($recu->percepteur)
        <div class="card">
            <div class="card-title">Percepteur</div>
            <div class="card-body">
                <div class="info-row">
                    <span class="info-label">Nom</span>
                    <span class="info-value">{{ trim($recu->percepteur->prenom . ' ' . $recu->percepteur->nom) }}</span>
                </div>
            </div>
        </div>
        @endif

        @if($recu->observations)
        <div class="card">
            <div class="card-title">Observations</div>
            <div class="card-body">
                <p style="font-size:13px;color:#555;line-height:1.5">{{ $recu->observations }}</p>
            </div>
        </div>
        @endif

        <div class="footer">
            <div class="divider"></div>
            <p>Vérification automatique via QR Code</p>
            <p style="margin-top:4px">Généré le {{ now()->format('d/m/Y à H:i') }}</p>
        </div>
    </div>
</body>
</html>
