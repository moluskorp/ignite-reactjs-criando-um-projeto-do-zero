import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      {console.log(post.data.content)}
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

  const newContent = response.data.content.map(content => {
    const contentHtml = RichText.asHtml(content.body);
    return {
      heading: content.heading,
      body: contentHtml,
    };
  });

  const post = {
    first_publication_date: response.first_publication_date,
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

  return {
    props: { post },
    revalidate: 60 * 30, // 30 minutes
  };
};
