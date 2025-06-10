export const homepage = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MRS Parc Info - Backend</title>
    <link rel="icon" type="image/png" href="https://www.mrsholdings.com/wp-content/uploads/2016/03/MRS-approved-logo-png-1.png" />
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 120px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            text-align: center;
            margin: 0;
        }
        .status {
            background-color: #e8f5e9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            text-align: center;
            font-size: 1.1em;
        }
        .endpoints {
            margin-top: 30px;
        }
        .endpoint-group {
            margin-bottom: 30px;
        }
        .endpoint-group h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .endpoint {
            background-color: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #3498db;
            transition: transform 0.2s;
        }
        .endpoint:hover {
            transform: translateX(5px);
            background-color: #e9ecef;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            margin-right: 10px;
            color: white;
        }
        .get { background-color: #28a745; }
        .post { background-color: #007bff; }
        .put { background-color: #ffc107; color: #000; }
        .delete { background-color: #dc3545; }
        .path {
            font-family: monospace;
            font-size: 1.1em;
            color: #2c3e50;
        }
        .description {
            margin-top: 8px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.mrsholdings.com/wp-content/uploads/2016/03/MRS-approved-logo-png-1.png" alt="MRS Logo" class="logo">
            <h1>MRS Parc Info - Backend</h1>
        </div>
        <div class="status">
            ✅ Le serveur backend est opérationnel
        </div>
        <div class="endpoints">
            <div class="endpoint-group">
                <h2>Authentification</h2>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">/api/auth/login</span>
                    <div class="description">Connexion utilisateur</div>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">/api/auth/register</span>
                    <div class="description">Inscription d'un nouvel utilisateur</div>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">/api/auth/logout</span>
                    <div class="description">Déconnexion utilisateur</div>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/auth/user</span>
                    <div class="description">Récupérer les informations de l'utilisateur connecté</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h2>Tableau de bord</h2>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/dashboard/stats</span>
                    <div class="description">Récupérer les statistiques du tableau de bord</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h2>Utilisateurs</h2>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/users</span>
                    <div class="description">Liste de tous les utilisateurs</div>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/users/:id</span>
                    <div class="description">Détails d'un utilisateur spécifique</div>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">/api/users</span>
                    <div class="description">Créer un nouvel utilisateur</div>
                </div>
                <div class="endpoint">
                    <span class="method put">PUT</span>
                    <span class="path">/api/users/:id</span>
                    <div class="description">Mettre à jour un utilisateur</div>
                </div>
                <div class="endpoint">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/users/:id</span>
                    <div class="description">Supprimer un utilisateur</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h2>Employés</h2>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/employees</span>
                    <div class="description">Liste de tous les employés</div>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/employees/:id</span>
                    <div class="description">Détails d'un employé spécifique</div>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">/api/employees</span>
                    <div class="description">Créer un nouvel employé</div>
                </div>
                <div class="endpoint">
                    <span class="method put">PUT</span>
                    <span class="path">/api/employees/:id</span>
                    <div class="description">Mettre à jour un employé</div>
                </div>
                <div class="endpoint">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/employees/:id</span>
                    <div class="description">Supprimer un employé</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h2>Équipements</h2>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/equipment</span>
                    <div class="description">Liste de tous les équipements</div>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/equipment/:id</span>
                    <div class="description">Détails d'un équipement spécifique</div>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">/api/equipment</span>
                    <div class="description">Créer un nouvel équipement</div>
                </div>
                <div class="endpoint">
                    <span class="method put">PUT</span>
                    <span class="path">/api/equipment/:id</span>
                    <div class="description">Mettre à jour un équipement</div>
                </div>
                <div class="endpoint">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/equipment/:id</span>
                    <div class="description">Supprimer un équipement</div>
                </div>
            </div>

            <div class="endpoint-group">
                <h2>Tickets</h2>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/tickets</span>
                    <div class="description">Liste de tous les tickets</div>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span>
                    <span class="path">/api/tickets/:id</span>
                    <div class="description">Détails d'un ticket spécifique</div>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span class="path">/api/tickets</span>
                    <div class="description">Créer un nouveau ticket</div>
                </div>
                <div class="endpoint">
                    <span class="method put">PUT</span>
                    <span class="path">/api/tickets/:id</span>
                    <div class="description">Mettre à jour un ticket</div>
                </div>
                <div class="endpoint">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/tickets/:id</span>
                    <div class="description">Supprimer un ticket</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`; 