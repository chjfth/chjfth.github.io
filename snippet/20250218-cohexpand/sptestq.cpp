// sptestq.cpp, only for Windows
#include <stdio.h>
#include <tchar.h>

#define WRAP_BQ(qs) _T("[") _T(qs) _T("]")

int _tmain()
{
    const TCHAR *psz = WRAP_BQ(greet); // no _T() wrapping now
    _tprintf(_T("Greeting: %s\n"), psz);
    return 0;
}


/* Note: Compile command-line can be tricky for this code.
	
	cl /D greet="\"Hello world\"" /D UNICODE /D _UNICODE sptestq.cpp
or
	cl /D greet="""Hello world""" /D UNICODE /D _UNICODE sptestq.cpp

*/
