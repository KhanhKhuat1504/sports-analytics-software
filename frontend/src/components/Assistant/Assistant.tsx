const AssistantFrame = () => (
    <iframe 
        src={`${import.meta.env.VITE_API_BASE_URL}/ai-assistant`}
        title="AI Assistant"
        style={{ width: "100%", height: "90vh", border: "none"}}
    />
);

export default AssistantFrame;