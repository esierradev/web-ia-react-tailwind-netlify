import { useState } from 'react';
import ReactMarkdown from 'react-markdown'; // PLUGIN PARA TRABAJAR CON MARKDOWN
import remarkGfm from 'remark-gfm'; // PLUGIN PARA TRABAJAR CON TABLAS EN MD


const GeminiChat = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    // ESTILOS PERSONALIZADOS PARA LAS TABLAS EN MD
    const MarkdownComponents = {
        table: ({ children }) => (
            <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-700">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => (
            <thead className="bg-gray-800">
                {children}
            </thead>
        ),
        tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-700">
                {children}
            </tbody>
        ),
        tr: ({ children, isHeader }) => (
            <tr className={isHeader ? 'bg-gray-800' : 'hover:bg-gray-800/50'}>
                {children}
            </tr>
        ),
        th: ({ children }) => (
            <th className="border border-gray-700 px-4 py-2 text-left font-bold text-white">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className="border border-gray-700 px-4 py-2 text-gray-300">
                {children}
            </td>
        ),
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userQuestion = input;
        setLoading(true);
        setInput('');

        // Lógica de detección de entorno (dev o produc)
        const apiKey = import.meta.env.VITE_API_KEY;
        const isDev = import.meta.env.VITE_ENVIRONMENT;

        // SI isDev ES TRUE (SIGNIFICA QUE ESTA EN MODO DEV) SE USA URL DE GOOGLE, SI ES FALSE SE USA NETLIFY FUNCTION
        const url = isDev
            ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`
            : '/.netlify/functions/gemini';

        try {
            const res = await fetch(url, {
                method: 'POST',
                contentType: 'application/json',
                headers: {
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify(
                    isDev
                        ? { contents: [{ parts: [{ text: userQuestion }] }] }
                        : { text: userQuestion }
                ),
            });

            const data = await res.json();

            if (res.ok) {
                const aiText = isDev
                    ? data.candidates[0].content.parts[0].text
                    : (data.candidates ? data.candidates[0].content.parts[0].text : data.text);

                setMessages((prev) => [
                    ...prev,
                    { question: userQuestion, answer: aiText }
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { question: userQuestion, answer: `**Error:** ${data.error || 'Algo salió mal'}` }
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { question: userQuestion, answer: '**Error:** No se pudo conectar con el servicio.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-[98%] h-[98%] mx-auto p-4 bg-black/40 rounded-2xl">

            {/* 1. ÁREA DE RESPUESTA (ARRIBA) */}
            <div className="flex-1 overflow-y-auto mb-4 p-4 rounded-xl bg-black/60 border-2 border-gray-800">
                {messages.length === 0 && !loading && (
                    <p className="text-gray-100 text-center mt-10">Tu respuesta aparecerá aquí...</p>
                )}

                {/* Mapeo del historial de mensajes */}
                {messages.map((msg, index) => (
                    <div key={index} className="mb-6 border-b border-gray-800 pb-4 last:border-none">
                        {/* Pregunta en Amarillo */}
                        <div className="text-yellow-400 font-semibold mb-2">
                            <span className="text-gray-400 text-xs mr-2">Tú:</span>
                            {msg.question}
                        </div>

                        {/* Respuesta en Markdown */}
                        <div className="prose prose-blue max-w-none text-gray-100">
                            {/* <ReactMarkdown>{msg.answer}</ReactMarkdown> */}
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={MarkdownComponents}
                            >
                                {msg.answer}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="animate-pulse text-blue-500 font-medium mt-2">
                        Gemini está pensando...
                    </div>
                )}
            </div>

            {/* 2. FORMULARIO (ABAJO) */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 pb-4">
                <textarea
                    className="w-full border-2 bg-black/60 border-gray-800 p-3 rounded-xl focus:border-blue-500 focus:outline-none text-white resize-none shadow-sm"
                    rows="3"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu consulta aquí..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md self-end"
                >
                    {loading ? 'Consultando...' : 'Enviar mensaje'}
                </button>
            </form>
        </div>
    );
};

export default GeminiChat;