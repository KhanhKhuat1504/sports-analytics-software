import gradio as gr 

# def greet(name):
#     return "Hello " + name + "!" 

demo = gr.Interface(
    fn=greet,
    inputs=["text"],
    outputs=["text"]
)

with gr.Blocks() as demo:
    file_input = gr.File()
    
    def upload_file(single_csv):
        return single_csv
    
    upload_button_component = gr.UploadButton("Click to upload CSV data", file_types=["file"], file_count="single")    
    
    upload_button_component.upload(upload_file, upload_button_component, file_input)

demo.launch(share=True)