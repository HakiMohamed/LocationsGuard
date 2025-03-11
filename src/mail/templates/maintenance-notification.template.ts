export const maintenanceNotificationTemplate = (
    maintenance: any,
    automobile: any
) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Notification de Maintenance</h2>
        </div>
        <div class="content">
            <p>Une maintenance est programmée pour le véhicule suivant :</p>
            
            <h3>Détails du Véhicule :</h3>
            <ul>
                <li>Marque : ${automobile.brand}</li>
                <li>Modèle : ${automobile.model}</li>
                <li>Immatriculation : ${automobile.licensePlate}</li>
            </ul>

            <h3>Détails de la Maintenance :</h3>
            <ul>
                <li>Type : ${maintenance.type}</li>
                <li>Date prévue : ${maintenance.scheduledDate.toLocaleDateString()}</li>
                <li>Description : ${maintenance.description || 'Non spécifié'}</li>
                <li>Coût estimé : ${maintenance.cost}€</li>
            </ul>

            <p>Veuillez vous assurer que le véhicule sera disponible pour cette maintenance.</p>
        </div>
        <div class="footer">
            <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>
`; 