// 20250215.4b answered by GPTo3-mini
#include <stdio.h>
#include <tchar.h>

#ifdef _UNICODE
  #define WRAP_BQ(s) L"[" L##s L"]"
#else
  #define WRAP_BQ(s) "[" s "]"
#endif

int _tmain(int argc, TCHAR* argv[])
{
    const TCHAR *psz = WRAP_BQ(greet);
    _tprintf(_T("Greeting: %s\n"), psz);
    return 0;
}
