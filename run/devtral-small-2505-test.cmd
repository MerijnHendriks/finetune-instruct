..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\Devstral-Small-2505-Q4_K_M.gguf ^
--temp 0.5 ^
--top_p 1.0 ^
--ctx-size 1024 ^
--parallel 1 ^
--mlock ^
--no-mmap
pause