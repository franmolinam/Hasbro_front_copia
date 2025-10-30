export default function BotonCasilla({ onClick, showImage }) {
    return (
        <div>
            <button onClick={onClick}>
                {showImage ? 'Ocultar' : 'Mostrar'}
            </button>
        </div>
    )
}