..\bin\llama.cpp-cuda\llama-server.exe ^
--model ..\models\Mistral-7B-Instruct-v0.3.Q8_0.gguf ^
--temp 0.5 ^
--top_p 1.0 ^
--ctx-size 49152 ^
--parallel 48 ^
--mlock ^
--no-mmap
pause