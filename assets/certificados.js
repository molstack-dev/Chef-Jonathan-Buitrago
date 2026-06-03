// Script para cargar y generar certificados PDF
(function() {
    // Cargar jsPDF desde CDN
    if (!window.jspdf) {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
    }

    async function loadCertificates() {
        try {
            const response = await fetch('/backend/api/certificados.php');
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                renderCertificates(result.data);
            } else {
                renderEmptyState();
            }
        } catch (e) {
            console.error('Error cargando certificados:', e);
            renderEmptyState();
        }
    }

    function renderCertificates(certificates) {
        const grid = document.getElementById('certificates-grid');
        if (!grid) return;

        grid.innerHTML = '';
        certificates.forEach(cert => {
            const completionDate = new Date(cert.registration_date).toLocaleDateString('es-ES');
            const card = document.createElement('div');
            card.className = 'p-6 bg-gray-700 rounded-xl hover:shadow-lg transition-all';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h5 class="text-lg font-semibold text-white mb-1">${cert.course_title}</h5>
                        <p class="text-gray-400 text-sm">Completado: ${completionDate}</p>
                    </div>
                    <span class="px-3 py-1 bg-green-900 text-green-300 rounded-full text-xs">Completado</span>
                </div>
                <div class="space-y-2">
                    <p class="text-gray-300 text-sm">Duración: ${cert.course_duration || 'N/A'}</p>
                </div>
                <div class="mt-4 flex justify-end space-x-3">
                    <button onclick="generateCertificatePDF('${cert.course_title}', '${completionDate}')" class="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm">
                        Descargar PDF
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function renderEmptyState() {
        const grid = document.getElementById('certificates-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-span-full text-center text-gray-400 py-8">
                <p class="text-xl mb-2">No tienes certificados aún.</p>
                <p class="text-sm">Completa un curso para obtener tu certificado.</p>
            </div>
        `;
    }

    window.generateCertificatePDF = async function(courseTitle, completionDate) {
        try {
            // Esperar a que jsPDF esté cargado
            if (!window.jspdf) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Fondo
            doc.setFillColor(30, 30, 40);
            doc.rect(0, 0, 297, 210, 'F');

            // Borde decorativo
            doc.setDrawColor(147, 112, 219);
            doc.setLineWidth(2);
            doc.rect(10, 10, 277, 190);

            // Borde interior
            doc.setLineWidth(0.5);
            doc.rect(15, 15, 267, 180);

            // Título
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(36);
            doc.setTextColor(147, 112, 219);
            doc.text('CERTIFICADO', 148.5, 50, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(200, 200, 200);
            doc.text('DE FINALIZACIÓN', 148.5, 62, { align: 'center' });

            // Línea decorativa
            doc.setDrawColor(147, 112, 219);
            doc.setLineWidth(1);
            doc.line(80, 70, 217, 70);

            // Texto de certificación
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.text('Se certifica que el participante ha completado satisfactoriamente', 148.5, 85, { align: 'center' });

            // Nombre del curso
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(255, 215, 0);
            doc.text(courseTitle, 148.5, 100, { align: 'center' });

            // Fecha
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(200, 200, 200);
            doc.text(`Fecha de finalización: ${completionDate}`, 148.5, 115, { align: 'center' });

            // Firma
            doc.setDrawColor(147, 112, 219);
            doc.setLineWidth(0.5);
            doc.line(60, 155, 130, 155);
            doc.setFontSize(10);
            doc.text('Chef Jonathan Buitrago', 95, 162, { align: 'center' });

            doc.line(167, 155, 237, 155);
            doc.text('Director Académico', 202, 162, { align: 'center' });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Chef Jonathan Buitrago - Cursos y Asesorías de Pastelería', 148.5, 190, { align: 'center' });

            // Descargar
            doc.save(`Certificado_${courseTitle.replace(/\s+/g, '_')}.pdf`);

        } catch (e) {
            console.error('Error generando PDF:', e);
            alert('Error al generar el certificado. Intenta de nuevo.');
        }
    };

    // Inicializar al cargar
    document.addEventListener('DOMContentLoaded', loadCertificates);
})();