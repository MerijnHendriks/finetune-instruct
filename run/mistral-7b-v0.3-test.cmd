..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\Mistral-7B-Instruct-v0.3.Q8_0.gguf ^
--temp 0.5 ^
--top_p 1.0 ^
--ctx-size 1024 ^
--parallel 1 ^
--no-kv-offload
pause