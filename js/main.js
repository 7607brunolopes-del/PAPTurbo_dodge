// Ponto de entrada

// Start initialization on load
window.onload = function() {
    init3D();
    setupEventListeners();
    selectGarageVehicle('car_sport');
    animate();
};
