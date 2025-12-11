..\bin\llama.cpp-cuda\llama-server.exe ^
--model ..\models\granite-4.0-h-tiny-Q8_0.gguf ^
--temp 0.0 ^
--top_p 1.0 ^
--ctx-size 32768 ^
--parallel 16 ^
--mlock ^
--no-mmap
pause