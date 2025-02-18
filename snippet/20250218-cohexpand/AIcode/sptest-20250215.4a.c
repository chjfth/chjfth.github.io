// 20250215.4a answered by DeepSeek R1

#include <stdio.h>
#include <tchar.h>

#define WRAP_BQ(s) "[" s "]"

int _tmain(int argc, TCHAR* argv[])
{
    const TCHAR *psz = _T( WRAP_BQ(greet) );
    _tprintf(_T("Greeting: %s\n"), psz);
    return 0;
}
