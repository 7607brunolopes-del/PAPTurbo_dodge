// Configuração do Tailwind CSS (carregar depois do CDN)

tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'],
                rajdhani: ['Rajdhani', 'sans-serif'],
                inter: ['Inter', 'sans-serif']
            },
            colors: {
                neonCyan: '#00f3ff',
                neonRed: '#ff0055',
                neonGold: '#ffb700',
                neonGreen: '#00ff66',
                darkBg: '#05070a'
            }
        }
    }
}
