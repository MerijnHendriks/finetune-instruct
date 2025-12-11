..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\meta-llama.Meta-Llama-3-8B-Instruct.Q8_0.gguf ^
--temp 0.6 ^
--top_p 0.9 ^
--ctx-size 32768 ^
--parallel 32 ^
--mlock ^
--no-mmap
pause