..\bin\llama.cpp-vulkan\llama-server.exe ^
--model ..\models\UserLM-8b.Q8_0.guff ^
--temp 0.6 ^
--top_p 0.9 ^
--ctx-size 1024 ^
--parallel 1 ^
--mlock ^
--no-mmap
pause