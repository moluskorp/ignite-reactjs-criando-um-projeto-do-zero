import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Link from 'next/link';
import { format } from 'date-fns';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    slug?: string;
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PreviousNextPost {
  uid: string;
  data: {
    title: string;
  };
}

interface PostProps {
  post: Post;
  nextPost: PreviousNextPost;
  previousPost: PreviousNextPost;
}

export default function Post({ post, nextPost, previousPost }: PostProps) {
  const router = useRouter();
  const createdAt = new Date(post.first_publication_date);
  const updatedAt = new Date(post.last_publication_date);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <div className={styles.image}>
        <img
          className={styles.postImage}
          src={post.data.banner.url}
          alt={post.data.slug}
        />
      </div>
      <div className={styles.content}>
        <h1>{post.data.title}</h1>
        <div className={styles.info}>
          <p>
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </p>
          <p>{post.data.author}</p>
          <p>4 min</p>
        </div>
        {updatedAt > createdAt ? (
          <div className={styles.edittedInfo}>
            <p>OI</p>
          </div>
        ) : null}

        <div className={styles.post}>
          {post.data.content.map(content => {
            const contentHtml = RichText.asHtml(content.body);
            return (
              <>
                <p>{content.heading}</p>
                <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
              </>
            );
          })}
        </div>
        <div className={styles.changePost}>
          <div className={styles.contentChangePost}>
            {previousPost ? (
              <>
                <div className={styles.previousPost}>
                  <p>{previousPost.data.title}</p>
                  <Link href={`/post/${previousPost.uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </div>
              </>
            ) : null}
          </div>
          <div className={styles.contentChangePost}>
            {nextPost ? (
              <div className={styles.nextPost}>
                <p>{nextPost.data.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        <Comments />
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      {
        params: {
          slug: 'como-utilizar-hooks',
        },
      },
      {
        params: {
          slug: 'criando-um-app-cra-do-zero',
        },
      },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const responseNext = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 1,
      page: 1,
      orderings: '[document.first_publication_date]',
      after: response.id,
    }
  );

  const responsePrevious = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 1,
      page: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  );

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      slug,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  console.log(post);

  const nextPost = responseNext.results[0];
  const previousPost = responsePrevious.results[0];

  return {
    props: {
      post,
      nextPost: nextPost || null,
      previousPost: previousPost || null,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
