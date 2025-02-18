// mxb2.c
#define NUM 3
#define KEEP(n) (n)

#define cox_ADD_SUFFIX(s, suffix) s ## suffix

#define MARK_SUFFIX(NUM, u) cox_ADD_SUFFIX(KEEP(NUM)+1, u)

int main()
{
    return MARK_SUFFIX(5, LL);
}
