import { GetStaticProps } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { useEffect, useRef, useState } from 'react';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const nextPage = useRef(postsPagination.next_page);

  useEffect(() => {
    setPosts(postsPagination.results);
  }, [postsPagination.results]);

  const handleLoadPosts = async () => {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then((data: PostPagination) => {
        nextPage.current = data.next_page;
        setPosts([...posts, ...data.results]);
      });
  };

  const havePosts = postsPagination.next_page ? () => handleLoadPosts() : null;
  const className = havePosts ? styles.active : styles.inactive;

  return (
    <>
      <div className={styles.container}>
        {posts.map(post => (
          <div key={post.uid} className={styles.posts}>
            <Link href={`/post/${post.uid}`}>
              <a>{post.data.title}</a>
            </Link>
            <p>{post.data.subtitle}</p>
            <div className={styles.info}>
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              <strong>{post.data.author}</strong>
            </div>
          </div>
        ))}
        {nextPage.current ? (
          <div className={styles.loadPosts}>
            <p onClick={havePosts} className={className}>
              Carregar mais posts
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse: PostPagination = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 20,
      page: 1,
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
  };
};
