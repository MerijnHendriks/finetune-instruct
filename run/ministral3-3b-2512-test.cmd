..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\Ministral-3-3B-Instruct-2512-Q8_0.gguf ^
--temp 0.5 ^
--top_p 1.0 ^
--ctx-size 1024 ^
--parallel 1 ^
--mlock ^
--no-mmap
pause