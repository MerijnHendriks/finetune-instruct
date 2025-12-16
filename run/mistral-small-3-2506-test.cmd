..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\Mistral-Small-3.2-24B-Instruct-2506-Q4_K_M.gguf ^
--temp 0.5 ^
--top_p 1.0 ^
--ctx-size 1024 ^
--parallel 1 ^
--mlock ^
--no-mmap
pause