// mxb1.c
enum { NUM = 3, NUML = 4 };
#define cox_ADD_SUFFIX(s, suffix) s ## suffix

#define NUM 3

int main()
{
    return cox_ADD_SUFFIX(NUM, L);
}
