export const clientCredentialsTemplate = (firstName: string, email: string, password: string): string => `
    <h2>Bienvenue sur notre plateforme de location de voitures</h2>
    <p>Bonjour ${firstName},</p>
    <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
    <p>Email : ${email}</p>
    <p>Mot de passe : ${password}</p>
    <p>Nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
    <p>Cordialement,<br>L'équipe de location de voitures</p>
`; 