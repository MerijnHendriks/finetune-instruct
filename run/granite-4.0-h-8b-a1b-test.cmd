..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\granite-4.0-h-tiny-Q8_0.gguf ^
--temp 0.0 ^
--top_p 1.0 ^
--ctx-size 2048 ^
--parallel 1 ^
--n-gpu-layers 20 ^
--no-kv-offload
pause