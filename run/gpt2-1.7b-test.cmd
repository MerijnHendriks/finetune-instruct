..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\gpt2-xl.Q8_0.gguf ^
--temp 0.5 ^
--top_p 1.0 ^
--ctx-size 1024 ^
--parallel 1 ^
--mlock ^
--no-mmap
pause