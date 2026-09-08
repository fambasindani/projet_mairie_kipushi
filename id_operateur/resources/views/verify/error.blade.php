<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reçu introuvable</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            color: #1a1a2e;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
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
        .container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .error-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            padding: 32px 24px;
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        .error-icon {
            width: 64px;
            height: 64px;
            background: #fdecea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
            color: #e74c3c;
        }
        .error-title {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 8px;
        }
        .error-message {
            font-size: 14px;
            color: #666;
            line-height: 1.5;
        }
        .error-number {
            display: inline-block;
            background: #f0f2f5;
            padding: 6px 12px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 14px;
            font-weight: 600;
            margin-top: 12px;
            color: #e74c3c;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="coat-of-arms">🇨🇩</div>
        <h1>République Démocratique du Congo</h1>
        <h2>Ville de Bukavu — Service de Perception</h2>
    </div>

    <div class="container">
        <div class="error-card">
            <div class="error-icon">✗</div>
            <div class="error-title">Reçu introuvable</div>
            <div class="error-message">
                Aucun reçu n'a été trouvé avec le numéro suivant :
            </div>
            <div class="error-number">{{ $numero }}</div>
        </div>
    </div>
</body>
</html>
